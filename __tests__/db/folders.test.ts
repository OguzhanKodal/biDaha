import {
  countFolders,
  createFolder,
  deleteFolder,
  getFolder,
  getFolderDeleteInfo,
  listFolders,
  listMoveTargets,
  listSiblingNames,
  moveQuestionsAndDeleteFolder,
  reorderFolders,
  updateFolder,
} from '@/db/folders';

import { createMigratedDatabase, type TestDatabase } from '../helpers/nodeSqlite';

const now = '2026-10-06T12:00:00.000Z';
const today = '2026-10-06';

let db: TestDatabase;

beforeEach(async () => {
  db = await createMigratedDatabase();
});

afterEach(() => {
  db.close();
});

function addQuestion(folderId: number, opts: { next?: string; completed?: boolean } = {}): void {
  db.run(
    `INSERT INTO questions (folder_id, question_image, next_review_date, completed_at, created_at, updated_at)
     VALUES (?, 'photos/q.jpg', ?, ?, ?, ?)`,
    folderId,
    opts.next ?? '2026-10-07',
    opts.completed ? now : null,
    now,
    now,
  );
}

async function subject(name: string) {
  return createFolder(db, { name, color: 'blue', parentId: null }, now);
}

describe('createFolder', () => {
  it('her seviyede sona ekler ve adı kırpar', async () => {
    const math = await subject('  Matematik ');
    const physics = await subject('Fizik');
    const derivative = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);

    expect(await getFolder(db, math)).toMatchObject({ name: 'Matematik', sort_order: 0, parent_id: null });
    expect(await getFolder(db, physics)).toMatchObject({ sort_order: 1 });
    expect(await getFolder(db, derivative)).toMatchObject({ sort_order: 0, parent_id: math, color: 'red' });
    expect(await countFolders(db, null)).toBe(2);
    expect(await countFolders(db, math)).toBe(1);
  });
});

describe('listFolders', () => {
  it('dersin sayılarına konularındaki soruları da katar', async () => {
    const math = await subject('Matematik');
    const derivative = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);
    await subject('Fizik');

    addQuestion(math, { next: today });
    addQuestion(derivative, { next: '2026-10-01' });
    addQuestion(derivative, { next: '2026-10-09' });
    addQuestion(derivative, { completed: true, next: '2026-10-01' });

    const subjects = await listFolders(db, null, today);
    expect(subjects.map((f) => [f.name, f.total, f.due, f.completed, f.topic_count])).toEqual([
      ['Matematik', 4, 2, 1, 1],
      ['Fizik', 0, 0, 0, 0],
    ]);

    const topics = await listFolders(db, math, today);
    expect(topics.map((f) => [f.name, f.total, f.due, f.completed])).toEqual([['Türev', 3, 1, 1]]);
  });

  it('sort_order sırasına uyar', async () => {
    const a = await subject('A');
    const b = await subject('B');
    const c = await subject('C');
    await reorderFolders(db, [c, a, b]);
    expect((await listFolders(db, null, today)).map((f) => f.name)).toEqual(['C', 'A', 'B']);
  });
});

describe('listSiblingNames', () => {
  it('sadece aynı seviyedeki adları, düzenlenen hariç verir', async () => {
    const math = await subject('Matematik');
    const physics = await subject('Fizik');
    await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);

    expect(await listSiblingNames(db, null)).toEqual(['Matematik', 'Fizik']);
    expect(await listSiblingNames(db, null, physics)).toEqual(['Matematik']);
    expect(await listSiblingNames(db, math)).toEqual(['Türev']);
  });
});

describe('updateFolder', () => {
  it('ad ve rengi günceller', async () => {
    const id = await subject('Matematk');
    await updateFolder(db, id, { name: ' Matematik ', color: 'green' });
    expect(await getFolder(db, id)).toMatchObject({ name: 'Matematik', color: 'green' });
  });
});

describe('deleteFolder', () => {
  it('boş dersi konularıyla birlikte siler', async () => {
    const math = await subject('Matematik');
    await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);

    expect(await getFolderDeleteInfo(db, math)).toEqual({ topicCount: 1, questionCount: 0 });
    await deleteFolder(db, math);
    expect(db.all('SELECT * FROM folders')).toHaveLength(0);
  });

  it('konusunda soru varsa hiçbir şeyi silmez', async () => {
    const math = await subject('Matematik');
    const derivative = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);
    addQuestion(derivative);

    expect(await getFolderDeleteInfo(db, math)).toEqual({ topicCount: 1, questionCount: 1 });
    await expect(deleteFolder(db, math)).rejects.toThrow();
    expect(db.all('SELECT * FROM folders')).toHaveLength(2);
    expect(db.all('SELECT * FROM questions')).toHaveLength(1);
  });
});

describe('moveQuestionsAndDeleteFolder', () => {
  it('soruları taşır, klasörü ve konularını siler', async () => {
    const math = await subject('Matematik');
    const derivative = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);
    const physics = await subject('Fizik');
    addQuestion(math);
    addQuestion(derivative);

    await moveQuestionsAndDeleteFolder(db, math, physics, now);

    expect(db.all<{ folder_id: number }>('SELECT folder_id FROM questions').map((q) => q.folder_id)).toEqual([
      physics,
      physics,
    ]);
    expect(db.all<{ name: string }>('SELECT name FROM folders').map((f) => f.name)).toEqual(['Fizik']);
  });

  it('klasörün kendisine ya da konusuna taşımayı reddeder', async () => {
    const math = await subject('Matematik');
    const derivative = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);
    addQuestion(math);

    await expect(moveQuestionsAndDeleteFolder(db, math, math, now)).rejects.toThrow();
    await expect(moveQuestionsAndDeleteFolder(db, math, derivative, now)).rejects.toThrow();
    expect(db.all('SELECT * FROM folders')).toHaveLength(2);
  });
});

describe('listMoveTargets', () => {
  it('klasörü ve konularını hariç tutar, ders › konu sırasıyla verir', async () => {
    const math = await subject('Matematik');
    await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);
    const physics = await subject('Fizik');
    await createFolder(db, { name: 'Optik', color: 'red', parentId: physics }, now);
    await createFolder(db, { name: 'Limit', color: 'red', parentId: math }, now);
    const chemistry = await subject('Kimya');

    const names = (await listMoveTargets(db, chemistry)).map((f) => f.name);
    expect(names).toEqual(['Matematik', 'Türev', 'Limit', 'Fizik', 'Optik']);

    const withoutMath = (await listMoveTargets(db, math)).map((f) => f.name);
    expect(withoutMath).toEqual(['Fizik', 'Optik', 'Kimya']);
  });
});
