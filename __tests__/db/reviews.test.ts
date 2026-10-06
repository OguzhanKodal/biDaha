import { createFolder } from '@/db/folders';
import { getQuestion, insertQuestion, reactivateQuestion, type QuestionInput } from '@/db/questions';
import { countActive, countDue, listReviewDays, listReviewItems, recordReview, undoReview } from '@/db/reviews';

import { createMigratedDatabase, type TestDatabase } from '../helpers/nodeSqlite';

const yesterday = '2026-10-05';
const today = '2026-10-06';
const now = '2026-10-06T18:00:00.000Z';

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

function input(folderId: number): QuestionInput {
  return {
    folderId,
    questionImage: 'photos/q.jpg',
    solutionImage: null,
    correctAnswer: null,
    note: null,
    sourceName: null,
    sourcePage: null,
    tagIds: [1],
  };
}

/** Dün eklenmiş → bugün tekrar günü gelmiş soru. */
async function dueQuestion(folderId: number, nextReview = today): Promise<number> {
  const id = await insertQuestion(db, input(folderId), now, yesterday);
  db.run('UPDATE questions SET next_review_date = ? WHERE id = ?', nextReview, id);
  return id;
}

describe('listReviewItems / countDue', () => {
  it('günü gelenleri en uzun bekleyen önce verir; ders seçilince konular dahil', async () => {
    const a = await dueQuestion(math, today);
    const b = await dueQuestion(derivative, '2026-10-01');
    const c = await dueQuestion(physics, '2026-10-03');
    await insertQuestion(db, input(math), now, today); // yarına planlı
    const done = await dueQuestion(math);
    db.run('UPDATE questions SET completed_at = ? WHERE id = ?', now, done);

    const all = await listReviewItems(db, { kind: 'due', folderId: null }, today);
    expect(all.map((q) => q.id)).toEqual([b, c, a]);
    expect(all[0]).toMatchObject({ folder_name: 'Türev', parent_folder_name: 'Matematik', tag_names: ['Dikkatsizlik'] });

    expect((await listReviewItems(db, { kind: 'due', folderId: math }, today)).map((q) => q.id)).toEqual([b, a]);
    expect((await listReviewItems(db, { kind: 'due', folderId: derivative }, today)).map((q) => q.id)).toEqual([b]);

    expect(await countDue(db, today)).toBe(3);
    expect(await countDue(db, today, math)).toBe(2);
  });

  it('serbest çalışma günü gelmemişleri de verir, tamamlananları vermez', async () => {
    const due = await dueQuestion(math);
    const later = await insertQuestion(db, input(derivative), now, today);
    const done = await dueQuestion(math);
    db.run('UPDATE questions SET completed_at = ? WHERE id = ?', now, done);

    const items = await listReviewItems(db, { kind: 'free', folderId: math }, today);
    expect(items.map((q) => q.id)).toEqual([due, later]);
    expect(await countActive(db, math)).toBe(2);
  });
});

describe('recordReview', () => {
  it('sayılan Çözdüm: soruyu ilerletir ve kayıt yazar', async () => {
    const id = await dueQuestion(math);
    const r = await recordReview(db, id, 'success', 5, today, now);

    expect(r).toMatchObject({ counted: true, completedNow: false, result: 'success' });
    expect(await getQuestion(db, id)).toMatchObject({ success_count: 1, next_review_date: '2026-10-09', last_result: 'success' });
    expect(db.all('SELECT question_id, review_date, result, counted FROM review_logs')).toEqual([
      { question_id: id, review_date: today, result: 'success', counted: 1 },
    ]);
  });

  it('son başarıda tamamlar', async () => {
    const id = await dueQuestion(math);
    db.run('UPDATE questions SET success_count = 2 WHERE id = ?', id);
    const r = await recordReview(db, id, 'success', 3, today, now);
    expect(r.completedNow).toBe(true);
    expect((await getQuestion(db, id))?.completed_at).toBe(now);
  });

  it('serbest çalışma: soru değişmez, kayıt sayılmadan yazılır', async () => {
    const id = await insertQuestion(db, input(math), now, today); // yarına planlı
    const before = await getQuestion(db, id);
    const r = await recordReview(db, id, 'fail', 5, today, now);

    expect(r.counted).toBe(false);
    expect(await getQuestion(db, id)).toEqual(before);
    expect(db.all<{ counted: number }>('SELECT counted FROM review_logs')).toEqual([{ counted: 0 }]);
  });

  it('olmayan soruda hata verir, kayıt yazmaz', async () => {
    await expect(recordReview(db, 999, 'success', 5, today, now)).rejects.toThrow();
    expect(db.all('SELECT * FROM review_logs')).toHaveLength(0);
  });
});

describe('undoReview', () => {
  it('soruyu önceki durumuna döndürür ve kaydı siler', async () => {
    const id = await dueQuestion(math);
    const before = await getQuestion(db, id);
    const r = await recordReview(db, id, 'fail', 5, today, now);

    await undoReview(db, r, '2026-10-06T18:01:00.000Z');

    const after = await getQuestion(db, id);
    expect(after).toMatchObject({
      success_count: before?.success_count,
      next_review_date: before?.next_review_date,
      last_result: before?.last_result,
      completed_at: before?.completed_at,
    });
    expect(db.all('SELECT * FROM review_logs')).toHaveLength(0);
  });

  it('tamamlanmayı da geri alır', async () => {
    const id = await dueQuestion(math);
    db.run('UPDATE questions SET success_count = 4 WHERE id = ?', id);
    const r = await recordReview(db, id, 'success', 5, today, now);
    await undoReview(db, r, now);
    expect(await getQuestion(db, id)).toMatchObject({ success_count: 4, completed_at: null, next_review_date: today });
  });
});

describe('reactivateQuestion', () => {
  it('tamamlanan soruyu sıfırlayıp yarına planlar', async () => {
    const id = await dueQuestion(math);
    db.run("UPDATE questions SET success_count = 5, completed_at = ?, last_result = 'success' WHERE id = ?", now, id);
    await reactivateQuestion(db, id, today, now);
    expect(await getQuestion(db, id)).toMatchObject({
      success_count: 0,
      completed_at: null,
      last_result: null,
      next_review_date: '2026-10-07',
    });
  });
});

describe('listReviewDays', () => {
  it('tekrar yapılan günleri tekrarsız, en yeni önce verir', async () => {
    const id = await dueQuestion(math);
    await recordReview(db, id, 'fail', 5, '2026-10-04', now);
    await recordReview(db, id, 'fail', 5, today, now);
    await recordReview(db, id, 'success', 5, today, now);
    expect(await listReviewDays(db)).toEqual([today, '2026-10-04']);
  });
});
