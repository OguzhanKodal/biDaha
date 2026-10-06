import { createErrorTag } from '@/db/errorTags';
import { createFolder } from '@/db/folders';
import { insertQuestion, type QuestionInput } from '@/db/questions';
import { getTagStats, listDailyReviews } from '@/db/stats';

import { createMigratedDatabase, type TestDatabase } from '../helpers/nodeSqlite';

const now = '2026-10-06T12:00:00.000Z';

let db: TestDatabase;
let math: number;
let derivative: number;
let physics: number;

beforeEach(async () => {
  db = await createMigratedDatabase();
  math = await createFolder(db, { name: 'Matematik', color: 'blue', parentId: null }, now);
  derivative = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);
  physics = await createFolder(db, { name: 'Fizik', color: 'green', parentId: null }, now);
});

afterEach(() => {
  db.close();
});

const question = (folderId: number, tagIds: number[]): QuestionInput => ({
  folderId,
  questionImage: 'photos/q.jpg',
  solutionImage: null,
  correctAnswer: null,
  note: null,
  sourceName: null,
  sourcePage: null,
  tagIds,
});

describe('getTagStats', () => {
  it('her nedenin kaç soruda seçildiğini ve etiketsiz soruları sayar; ders konularını kapsar', async () => {
    const custom = await createErrorTag(db, 'Formül');
    await insertQuestion(db, question(math, [1, 2]), now, '2026-10-06');
    await insertQuestion(db, question(derivative, [1, custom]), now, '2026-10-06');
    await insertQuestion(db, question(derivative, []), now, '2026-10-06');
    await insertQuestion(db, question(physics, [1]), now, '2026-10-06');

    const mathStats = await getTagStats(db, math);
    expect(mathStats.questionCount).toBe(3);
    expect(mathStats.untagged).toBe(1);
    const count = (stats: typeof mathStats, id: number) => stats.tags.find((t) => t.id === id)?.count;
    expect(count(mathStats, 1)).toBe(2);
    expect(count(mathStats, 2)).toBe(1);
    expect(count(mathStats, custom)).toBe(1);
    expect(count(mathStats, 3)).toBe(0);

    const all = await getTagStats(db, null);
    expect(all.questionCount).toBe(4);
    expect(count(all, 1)).toBe(3);

    const topic = await getTagStats(db, derivative);
    expect([topic.questionCount, topic.untagged, count(topic, 1)]).toEqual([2, 1, 1]);
  });

  it('soru yoksa sıfırlar', async () => {
    const stats = await getTagStats(db, null);
    expect(stats.questionCount).toBe(0);
    expect(stats.untagged).toBe(0);
    expect(stats.tags.every((t) => t.count === 0)).toBe(true);
  });
});

describe('listDailyReviews', () => {
  it('günlere göre toplam ve çözülen sayısını verir (serbest çalışma dahil)', async () => {
    const id = await insertQuestion(db, question(math, []), now, '2026-10-01');
    const log = (date: string, result: string, counted: number) =>
      db.run(
        'INSERT INTO review_logs (question_id, reviewed_at, review_date, result, counted) VALUES (?, ?, ?, ?, ?)',
        id,
        now,
        date,
        result,
        counted,
      );
    log('2026-09-01', 'success', 1);
    log('2026-10-05', 'success', 1);
    log('2026-10-05', 'fail', 0);
    log('2026-10-06', 'fail', 1);

    expect(await listDailyReviews(db, '2026-09-07')).toEqual([
      { review_date: '2026-10-05', total: 2, solved: 1 },
      { review_date: '2026-10-06', total: 1, solved: 0 },
    ]);
  });
});
