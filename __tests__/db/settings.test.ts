import { insertQuestion } from '@/db/questions';
import {
  changeTargetRepetitions,
  completeOnboarding,
  countCompletedByTarget,
  getSettings,
  listDueGroups,
  resetAllData,
  updateSettings,
} from '@/db/settings';

import { createMigratedDatabase, type TestDatabase } from '../helpers/nodeSqlite';

const now = '2026-10-06T12:00:00.000Z';

let db: TestDatabase;

beforeEach(async () => {
  db = await createMigratedDatabase();
});

afterEach(() => {
  db.close();
});

describe('completeOnboarding', () => {
  it('ayarları kaydeder ve hazır dersleri oluşturur', async () => {
    await completeOnboarding(db, { name: 'Ayşe', exam: 'KPSS', repetitions: 7, examDate: '2027-07-12', reminderTime: '07:30', remindersEnabled: true }, now);

    expect(await getSettings(db)).toMatchObject({
      name: 'Ayşe',
      exam_type: 'KPSS',
      target_repetitions: 7,
      exam_date: '2027-07-12',
      notification_time: '07:30',
      notifications_enabled: 1,
      onboarding_done: 1,
    });
    const folders = db.all<{ name: string; parent_id: number | null }>(
      'SELECT name, parent_id FROM folders ORDER BY sort_order',
    );
    expect(folders).toHaveLength(7);
    expect(folders[0]).toEqual({ name: 'Türkçe', parent_id: null });
  });

  it('Diğer seçilince klasör oluşturmaz', async () => {
    await completeOnboarding(db, { name: 'Can', exam: 'OTHER', repetitions: 5, examDate: null, reminderTime: '20:00', remindersEnabled: false }, now);
    expect(db.all('SELECT * FROM folders')).toHaveLength(0);
    expect((await getSettings(db)).onboarding_done).toBe(1);
  });

  it('ikinci kez çağrılırsa dersleri tekrar eklemez, ayarları değiştirmez', async () => {
    await completeOnboarding(db, { name: 'Ayşe', exam: 'DGS', repetitions: 5, examDate: null, reminderTime: '20:00', remindersEnabled: false }, now);
    await completeOnboarding(db, { name: 'Başka', exam: 'YKS', repetitions: 3, examDate: null, reminderTime: '20:00', remindersEnabled: false }, now);

    expect(db.all('SELECT * FROM folders')).toHaveLength(5);
    expect(await getSettings(db)).toMatchObject({ name: 'Ayşe', exam_type: 'DGS' });
  });
});

describe('resetAllData', () => {
  it('her şeyi silip onboarding öncesine döner, hazır etiketleri korur', async () => {
    await completeOnboarding(db, { name: 'Ayşe', exam: 'YKS', repetitions: 5, examDate: null, reminderTime: '20:00', remindersEnabled: false }, now);
    db.run("INSERT INTO error_tags (name) VALUES ('Özel')");
    db.run(
      `INSERT INTO questions (folder_id, question_image, next_review_date, created_at, updated_at)
       VALUES ((SELECT MIN(id) FROM folders), 'q.jpg', '2026-10-07', ?, ?)`,
      now,
      now,
    );

    await resetAllData(db);

    expect(db.all('SELECT * FROM folders')).toHaveLength(0);
    expect(db.all('SELECT * FROM questions')).toHaveLength(0);
    expect(db.all('SELECT * FROM error_tags')).toHaveLength(6);
    expect(await getSettings(db)).toMatchObject({ name: null, exam_type: null, onboarding_done: 0 });
  });
});

describe('updateSettings', () => {
  it('sadece verilen alanları günceller', async () => {
    await updateSettings(db, { name: 'Can', notifications_enabled: true, notification_time: '08:15' });
    await updateSettings(db, { exam_date: '2027-06-20' });
    await updateSettings(db, { exam_date: null, exam_type: 'DGS' });
    expect(await getSettings(db)).toMatchObject({
      name: 'Can',
      notifications_enabled: 1,
      notification_time: '08:15',
      exam_date: null,
      exam_type: 'DGS',
      target_repetitions: 5,
    });
  });
});

describe('changeTargetRepetitions', () => {
  async function questionWithSuccess(success: number, completed = false) {
    const folder = db.all<{ id: number }>('SELECT id FROM folders LIMIT 1')[0].id;
    const id = await insertQuestion(
      db,
      { folderId: folder, questionImage: 'q.jpg', solutionImage: null, correctAnswer: null, note: null, sourceName: null, sourcePage: null, tagIds: [] },
      now,
      '2026-10-06',
    );
    db.run('UPDATE questions SET success_count = ?, completed_at = ? WHERE id = ?', success, completed ? now : null, id);
    return id;
  }

  beforeEach(async () => {
    await completeOnboarding(db, { name: 'A', exam: 'DGS', repetitions: 5, examDate: null, reminderTime: '20:00', remindersEnabled: false }, now);
  });

  it('N düşünce başarısı yeni N\'e ulaşan aktif sorular tamamlanır', async () => {
    await questionWithSuccess(1);
    await questionWithSuccess(3);
    await questionWithSuccess(4);
    expect(await countCompletedByTarget(db, 3)).toBe(2);

    const later = '2026-10-07T10:00:00.000Z';
    expect(await changeTargetRepetitions(db, 3, later)).toBe(2);
    expect((await getSettings(db)).target_repetitions).toBe(3);
    expect(db.all<{ success_count: number; completed_at: string | null }>('SELECT success_count, completed_at FROM questions ORDER BY id')).toEqual([
      { success_count: 1, completed_at: null },
      { success_count: 3, completed_at: later },
      { success_count: 4, completed_at: later },
    ]);
  });

  it('N artınca tamamlanan sorular tamamlanmış kalır', async () => {
    await questionWithSuccess(5, true);
    await questionWithSuccess(2);
    expect(await changeTargetRepetitions(db, 8, now)).toBe(0);
    expect(db.all<{ completed_at: string | null }>('SELECT completed_at FROM questions ORDER BY id')).toEqual([
      { completed_at: now },
      { completed_at: null },
    ]);
  });
});

describe('listDueGroups', () => {
  it('aktif soruları tekrar gününe göre gruplar', async () => {
    await completeOnboarding(db, { name: 'A', exam: 'DGS', repetitions: 5, examDate: null, reminderTime: '20:00', remindersEnabled: false }, now);
    const folder = db.all<{ id: number }>('SELECT id FROM folders LIMIT 1')[0].id;
    const input = { folderId: folder, questionImage: 'q.jpg', solutionImage: null, correctAnswer: null, note: null, sourceName: null, sourcePage: null, tagIds: [] };
    await insertQuestion(db, input, now, '2026-10-06');
    await insertQuestion(db, input, now, '2026-10-06');
    const done = await insertQuestion(db, input, now, '2026-10-01');
    db.run('UPDATE questions SET completed_at = ? WHERE id = ?', now, done);
    expect(await listDueGroups(db)).toEqual([{ next_review_date: '2026-10-07', count: 2 }]);
  });
});
