import { exportData, importData, isBackupData, markBackupDone, photoPathsOf } from '@/db/backup';
import { createErrorTag } from '@/db/errorTags';
import { createFolder } from '@/db/folders';
import { insertQuestion } from '@/db/questions';
import { recordReview } from '@/db/reviews';
import { completeOnboarding, getSettings } from '@/db/settings';

import { createMigratedDatabase, type TestDatabase } from '../helpers/nodeSqlite';

const now = '2026-10-06T12:00:00.000Z';

let source: TestDatabase;
let target: TestDatabase;

beforeEach(async () => {
  source = await createMigratedDatabase();
  target = await createMigratedDatabase();
});

afterEach(() => {
  source.close();
  target.close();
});

/** Her tablodan veri içeren, gerçekçi bir veritabanı. */
async function fill(db: TestDatabase) {
  await completeOnboarding(
    db,
    { name: 'Ayşe', exam: 'DGS', repetitions: 4, examDate: '2027-07-12', reminderTime: '19:30', remindersEnabled: true },
    now,
  );
  const math = db.all<{ id: number }>("SELECT id FROM folders WHERE name = 'Matematik'")[0].id;
  const topic = await createFolder(db, { name: 'Türev', color: 'red', parentId: math }, now);
  const tag = await createErrorTag(db, 'Formülü unuttum');
  const q1 = await insertQuestion(
    db,
    {
      folderId: topic,
      questionImage: 'photos/a.jpg',
      solutionImage: 'photos/b.jpg',
      correctAnswer: 'C',
      note: 'Zincir kuralı — dikkat!',
      sourceName: '3D Yayınları',
      sourcePage: '42',
      tagIds: [1, tag],
    },
    now,
    '2026-10-05',
  );
  await insertQuestion(
    db,
    { folderId: math, questionImage: 'photos/c.jpg', solutionImage: null, correctAnswer: null, note: null, sourceName: null, sourcePage: null, tagIds: [] },
    now,
    '2026-10-05',
  );
  await recordReview(db, q1, 'success', 4, '2026-10-06', now);
}

describe('exportData / importData', () => {
  it('gidiş-dönüş: içe aktarılan veri dışa aktarılanla birebir aynı', async () => {
    await fill(source);
    const exported = await exportData(source);
    // JSON'dan geçiş, gerçek yedek dosyasını taklit eder.
    const fromFile = JSON.parse(JSON.stringify(exported));
    expect(isBackupData(fromFile)).toBe(true);

    await importData(target, fromFile, now);

    const reimported = await exportData(target);
    expect(reimported).toEqual({ ...exported, settings: { ...exported.settings, last_backup_at: now } });
    expect(await getSettings(target)).toMatchObject({ name: 'Ayşe', exam_type: 'DGS', notification_time: '19:30', onboarding_done: 1 });
  });

  it('dolu veritabanının üzerine yazar; eski veri kalmaz', async () => {
    await fill(source);
    await completeOnboarding(target, { name: 'Eski', exam: 'YKS', repetitions: 5, examDate: null, reminderTime: '20:00', remindersEnabled: false }, now);
    await createErrorTag(target, 'Eski etiket');

    await importData(target, await exportData(source), now);

    expect(target.all<{ name: string }>("SELECT name FROM error_tags WHERE name = 'Eski etiket'")).toHaveLength(0);
    expect(target.all('SELECT * FROM folders')).toHaveLength(source.all('SELECT * FROM folders').length);
    expect((await getSettings(target)).name).toBe('Ayşe');
  });

  it('bozuk yedekte hiçbir şeyi değiştirmez', async () => {
    await fill(target);
    const before = await exportData(target);
    const broken = await exportData(target);
    broken.questions[0] = { ...broken.questions[0], folder_id: 9999 }; // olmayan klasör

    await expect(importData(target, broken, now)).rejects.toThrow();
    expect(await exportData(target)).toEqual(before);
  });

  it('beklenmeyen alanları yok sayar', async () => {
    await fill(source);
    const data = await exportData(source);
    const tampered = { ...data, folders: data.folders.map((f) => ({ ...f, 'name) VALUES (1); DROP TABLE questions; --': 'x' })) };
    await importData(target, tampered, now);
    expect(target.all('SELECT * FROM questions')).toHaveLength(2);
  });
});

describe('yardımcılar', () => {
  it('fotoğraf yollarını toplar', async () => {
    await fill(source);
    expect(photoPathsOf(await exportData(source)).sort()).toEqual(['photos/a.jpg', 'photos/b.jpg', 'photos/c.jpg']);
  });

  it('isBackupData yapıyı kontrol eder', () => {
    expect(isBackupData(null)).toBe(false);
    expect(isBackupData({ settings: {}, folders: [] })).toBe(false);
  });

  it('markBackupDone son yedek zamanını yazar', async () => {
    await markBackupDone(source, now);
    expect((await getSettings(source)).last_backup_at).toBe(now);
  });
});
