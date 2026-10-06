import { completeOnboarding, devResetAllData, getSettings } from '@/db/settings';

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
    await completeOnboarding(db, { name: 'Ayşe', exam: 'KPSS', repetitions: 7, examDate: '2027-07-12' }, now);

    expect(await getSettings(db)).toMatchObject({
      name: 'Ayşe',
      exam_type: 'KPSS',
      target_repetitions: 7,
      exam_date: '2027-07-12',
      onboarding_done: 1,
    });
    const folders = db.all<{ name: string; parent_id: number | null }>(
      'SELECT name, parent_id FROM folders ORDER BY sort_order',
    );
    expect(folders).toHaveLength(7);
    expect(folders[0]).toEqual({ name: 'Türkçe', parent_id: null });
  });

  it('Diğer seçilince klasör oluşturmaz', async () => {
    await completeOnboarding(db, { name: 'Can', exam: 'OTHER', repetitions: 5, examDate: null }, now);
    expect(db.all('SELECT * FROM folders')).toHaveLength(0);
    expect((await getSettings(db)).onboarding_done).toBe(1);
  });

  it('ikinci kez çağrılırsa dersleri tekrar eklemez, ayarları değiştirmez', async () => {
    await completeOnboarding(db, { name: 'Ayşe', exam: 'DGS', repetitions: 5, examDate: null }, now);
    await completeOnboarding(db, { name: 'Başka', exam: 'YKS', repetitions: 3, examDate: null }, now);

    expect(db.all('SELECT * FROM folders')).toHaveLength(5);
    expect(await getSettings(db)).toMatchObject({ name: 'Ayşe', exam_type: 'DGS' });
  });
});

describe('devResetAllData', () => {
  it('her şeyi silip onboarding öncesine döner, hazır etiketleri korur', async () => {
    await completeOnboarding(db, { name: 'Ayşe', exam: 'YKS', repetitions: 5, examDate: null }, now);
    db.run("INSERT INTO error_tags (name) VALUES ('Özel')");
    db.run(
      `INSERT INTO questions (folder_id, question_image, next_review_date, created_at, updated_at)
       VALUES ((SELECT MIN(id) FROM folders), 'q.jpg', '2026-10-07', ?, ?)`,
      now,
      now,
    );

    await devResetAllData(db);

    expect(db.all('SELECT * FROM folders')).toHaveLength(0);
    expect(db.all('SELECT * FROM questions')).toHaveLength(0);
    expect(db.all('SELECT * FROM error_tags')).toHaveLength(6);
    expect(await getSettings(db)).toMatchObject({ name: null, exam_type: null, onboarding_done: 0 });
  });
});
