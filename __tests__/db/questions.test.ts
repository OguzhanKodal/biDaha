import { createErrorTag, listErrorTags } from '@/db/errorTags';
import { createFolder, deleteFolderWithQuestions } from '@/db/folders';
import {
  countQuestionsByStatus,
  deleteQuestion,
  getQuestion,
  insertQuestion,
  listAllPhotoPaths,
  listQuestions,
  listRecentSources,
  setSolutionImage,
  updateQuestion,
  type QuestionInput,
} from '@/db/questions';

import { createMigratedDatabase, type TestDatabase } from '../helpers/nodeSqlite';

const today = '2026-10-06';
const at = (minute: number) => `2026-10-06T12:${String(minute).padStart(2, '0')}:00.000Z`;

let db: TestDatabase;
let math: number;
let derivative: number;

beforeEach(async () => {
  db = await createMigratedDatabase();
  math = await createFolder(db, { name: 'Matematik', color: 'blue', parentId: null }, at(0));
  derivative = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, at(0));
});

afterEach(() => {
  db.close();
});

function input(overrides: Partial<QuestionInput> = {}): QuestionInput {
  return {
    folderId: math,
    questionImage: 'photos/q.jpg',
    solutionImage: null,
    correctAnswer: null,
    note: null,
    sourceName: null,
    sourcePage: null,
    tagIds: [],
    ...overrides,
  };
}

describe('insertQuestion / getQuestion', () => {
  it('yeni soruyu yarına planlar, etiketleri ve klasör adını getirir', async () => {
    const id = await insertQuestion(
      db,
      input({ folderId: derivative, correctAnswer: 'C', note: 'Zincir kuralı', tagIds: [2, 1, 2] }),
      at(1),
      today,
    );

    const q = await getQuestion(db, id);
    expect(q).toMatchObject({
      success_count: 0,
      next_review_date: '2026-10-07',
      completed_at: null,
      last_result: null,
      correct_answer: 'C',
      note: 'Zincir kuralı',
      folder_name: 'Türev',
      parent_folder_name: 'Matematik',
      tag_ids: [1, 2],
      tag_names: ['Dikkatsizlik', 'Bilgi eksikliği'],
    });
  });

  it('olmayan soru için null döner', async () => {
    expect(await getQuestion(db, 999)).toBeNull();
  });

  it('geçersiz etikette hiçbir şey kaydetmez', async () => {
    await expect(insertQuestion(db, input({ tagIds: [999] }), at(1), today)).rejects.toThrow();
    expect(db.all('SELECT * FROM questions')).toHaveLength(0);
  });
});

describe('updateQuestion', () => {
  it('içeriği ve etiketleri değiştirir, tekrar durumuna dokunmaz', async () => {
    const id = await insertQuestion(db, input({ tagIds: [1] }), at(1), today);
    db.run("UPDATE questions SET success_count = 2, next_review_date = '2026-10-20' WHERE id = ?", id);

    await updateQuestion(db, id, input({ folderId: derivative, note: 'Yeni not', tagIds: [3] }), at(5));

    const q = await getQuestion(db, id);
    expect(q).toMatchObject({
      folder_id: derivative,
      note: 'Yeni not',
      tag_ids: [3],
      success_count: 2,
      next_review_date: '2026-10-20',
      updated_at: at(5),
    });
  });

  it('çözüm fotoğrafı sonradan eklenebilir', async () => {
    const id = await insertQuestion(db, input(), at(1), today);
    await setSolutionImage(db, id, 'photos/s.jpg', at(2));
    expect((await getQuestion(db, id))?.solution_image).toBe('photos/s.jpg');
  });
});

describe('listQuestions', () => {
  it('sadece klasörün kendi sorularını, duruma göre listeler', async () => {
    const a = await insertQuestion(db, input(), at(1), today);
    await insertQuestion(db, input({ folderId: derivative }), at(2), today);
    const done = await insertQuestion(db, input(), at(3), today);
    db.run('UPDATE questions SET completed_at = ? WHERE id = ?', at(4), done);

    expect((await listQuestions(db, math, 'active', 'nextReview')).map((q) => q.id)).toEqual([a]);
    expect((await listQuestions(db, math, 'completed', 'nextReview')).map((q) => q.id)).toEqual([done]);
    expect(await countQuestionsByStatus(db, math)).toEqual({ active: 1, completed: 1 });
  });

  it('sıralama seçeneklerine uyar', async () => {
    const first = await insertQuestion(db, input(), at(1), today);
    const second = await insertQuestion(db, input(), at(2), today);
    const third = await insertQuestion(db, input(), at(3), today);
    db.run("UPDATE questions SET next_review_date = '2026-10-10' WHERE id = ?", first);
    for (let i = 0; i < 2; i++) {
      db.run(
        `INSERT INTO review_logs (question_id, reviewed_at, review_date, result, counted)
         VALUES (?, ?, '2026-10-05', 'fail', 1)`,
        third,
        at(9),
      );
    }

    const ids = async (sort: 'nextReview' | 'createdAt' | 'mostFailed') =>
      (await listQuestions(db, math, 'active', sort)).map((q) => q.id);
    expect(await ids('nextReview')).toEqual([second, third, first]);
    expect(await ids('createdAt')).toEqual([third, second, first]);
    expect(await ids('mostFailed')).toEqual([third, second, first]);
    expect((await listQuestions(db, math, 'active', 'mostFailed'))[0].fail_count).toBe(2);
  });
});

describe('listRecentSources', () => {
  it('en son kullanılan kaynakları tekrarsız verir', async () => {
    await insertQuestion(db, input({ sourceName: 'Limit' }), at(1), today);
    await insertQuestion(db, input({ sourceName: '3D' }), at(2), today);
    await insertQuestion(db, input({ sourceName: 'Limit' }), at(3), today);
    await insertQuestion(db, input(), at(4), today);
    expect(await listRecentSources(db)).toEqual(['Limit', '3D']);
  });
});

describe('deleteQuestion', () => {
  it('kaydı siler ve fotoğraf yollarını döner', async () => {
    const id = await insertQuestion(
      db,
      input({ questionImage: 'photos/a.jpg', solutionImage: 'photos/b.jpg', tagIds: [1] }),
      at(1),
      today,
    );
    expect(await deleteQuestion(db, id)).toEqual(['photos/a.jpg', 'photos/b.jpg']);
    expect(db.all('SELECT * FROM questions')).toHaveLength(0);
    expect(db.all('SELECT * FROM question_tags')).toHaveLength(0);
    expect(await deleteQuestion(db, id)).toEqual([]);
  });
});

describe('deleteFolderWithQuestions', () => {
  it('dersi, konularını ve tüm sorularını siler; fotoğrafları döner', async () => {
    const other = await createFolder(db, { name: 'Fizik', color: 'green', parentId: null }, at(0));
    await insertQuestion(db, input({ questionImage: 'photos/1.jpg' }), at(1), today);
    await insertQuestion(db, input({ folderId: derivative, questionImage: 'photos/2.jpg', solutionImage: 'photos/3.jpg' }), at(2), today);
    await insertQuestion(db, input({ folderId: other, questionImage: 'photos/keep.jpg' }), at(3), today);

    const photos = await deleteFolderWithQuestions(db, math);

    expect(photos.sort()).toEqual(['photos/1.jpg', 'photos/2.jpg', 'photos/3.jpg']);
    expect(db.all<{ name: string }>('SELECT name FROM folders').map((f) => f.name)).toEqual(['Fizik']);
    expect([...(await listAllPhotoPaths(db))]).toEqual(['photos/keep.jpg']);
  });
});

describe('createErrorTag', () => {
  it('kullanıcı etiketini sona ekler', async () => {
    await createErrorTag(db, ' Formül ');
    const tags = await listErrorTags(db);
    expect(tags.at(-1)).toMatchObject({ name: 'Formül', is_default: 0 });
  });
});
