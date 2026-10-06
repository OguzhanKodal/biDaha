import { getSchemaVersion, migrate } from '@/db/migrate';
import { migrations } from '@/db/migrations';
import type { Migration } from '@/db/migrations/types';
import type { ErrorTagRow, SettingsRow } from '@/db/types';
import { defaultErrorTags } from '@/domain/errorTags';

import { TestDatabase } from '../helpers/nodeSqlite';

let db: TestDatabase;

beforeEach(() => {
  db = new TestDatabase();
});

afterEach(() => {
  db.close();
});

const now = '2026-10-06T12:00:00.000Z';

function insertFolder(name = 'TYT Matematik'): number {
  db.run('INSERT INTO folders (name, created_at) VALUES (?, ?)', name, now);
  return db.all<{ id: number }>('SELECT last_insert_rowid() AS id')[0].id;
}

function insertQuestion(folderId: number): number {
  db.run(
    `INSERT INTO questions (folder_id, question_image, next_review_date, created_at, updated_at)
     VALUES (?, 'photos/q1.jpg', '2026-10-07', ?, ?)`,
    folderId,
    now,
    now,
  );
  return db.all<{ id: number }>('SELECT last_insert_rowid() AS id')[0].id;
}

describe('migrate', () => {
  it('boş veritabanını en son sürüme getirir', async () => {
    await migrate(db);
    expect(await getSchemaVersion(db)).toBe(migrations.length);

    const tables = db
      .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .map((t) => t.name);
    expect(tables).toEqual(['error_tags', 'folders', 'question_tags', 'questions', 'review_logs', 'settings']);
  });

  it('varsayılan ayarları tek satır olarak oluşturur', async () => {
    await migrate(db);
    const rows = db.all<SettingsRow>('SELECT * FROM settings');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 1,
      name: null,
      exam_type: null,
      target_repetitions: 5,
      notifications_enabled: 0,
      notification_time: '20:00',
      onboarding_done: 0,
    });
    expect(() => db.run('INSERT INTO settings (id) VALUES (2)')).toThrow();
  });

  it('hazır hata etiketlerini ekler', async () => {
    await migrate(db);
    const tags = db.all<ErrorTagRow>('SELECT * FROM error_tags ORDER BY id');
    expect(tags.map((t) => t.name)).toEqual([...defaultErrorTags]);
    expect(tags.every((t) => t.is_default === 1)).toBe(true);
  });

  it('ikinci çalıştırmada hiçbir şeyi değiştirmez ve veriyi korur', async () => {
    await migrate(db);
    const folderId = insertFolder();
    insertQuestion(folderId);

    await migrate(db);

    expect(await getSchemaVersion(db)).toBe(migrations.length);
    expect(db.all('SELECT * FROM questions')).toHaveLength(1);
    expect(db.all('SELECT * FROM settings')).toHaveLength(1);
  });

  it('hata veren migration tamamen geri alınır, önceki veri korunur', async () => {
    await migrate(db);
    insertFolder();

    const broken: Migration = {
      version: migrations.length + 1,
      name: 'broken',
      up: async (txn) => {
        await txn.execAsync('ALTER TABLE folders ADD COLUMN icon TEXT');
        await txn.execAsync('THIS IS NOT SQL');
      },
    };

    await expect(migrate(db, [...migrations, broken])).rejects.toThrow();
    expect(await getSchemaVersion(db)).toBe(migrations.length);
    const columns = db.all<{ name: string }>('PRAGMA table_info(folders)').map((c) => c.name);
    expect(columns).not.toContain('icon');
    expect(db.all('SELECT * FROM folders')).toHaveLength(1);
  });

  it('uygulamadan yeni sürümlü veritabanına dokunmaz', async () => {
    await migrate(db);
    db.raw.exec('PRAGMA user_version = 99');
    await expect(migrate(db)).rejects.toThrow(/yeni/);
    expect(db.all('SELECT * FROM settings')).toHaveLength(1);
  });

  it('sırası bozuk migration listesini reddeder', async () => {
    const gap: Migration = { version: 3, name: 'gap', up: async () => {} };
    await expect(migrate(db, [...migrations, gap])).rejects.toThrow(/sırası/);
    expect(await getSchemaVersion(db)).toBe(0);
  });
});

describe('001_initial şema kuralları', () => {
  beforeEach(async () => {
    await migrate(db);
  });

  it('içinde soru olan klasör silinemez', () => {
    const folderId = insertFolder();
    insertQuestion(folderId);
    expect(() => db.run('DELETE FROM folders WHERE id = ?', folderId)).toThrow();
  });

  it('alt konusu olan ders silinemez', () => {
    const parentId = insertFolder('TYT Matematik');
    db.run('INSERT INTO folders (name, parent_id, created_at) VALUES (?, ?, ?)', 'Türev', parentId, now);
    expect(() => db.run('DELETE FROM folders WHERE id = ?', parentId)).toThrow();
  });

  it('soru silinince etiket bağları ve tekrar kayıtları da silinir', () => {
    const questionId = insertQuestion(insertFolder());
    db.run('INSERT INTO question_tags (question_id, tag_id) VALUES (?, 1)', questionId);
    db.run(
      `INSERT INTO review_logs (question_id, reviewed_at, review_date, result, counted)
       VALUES (?, ?, '2026-10-07', 'success', 1)`,
      questionId,
      now,
    );

    db.run('DELETE FROM questions WHERE id = ?', questionId);

    expect(db.all('SELECT * FROM question_tags')).toHaveLength(0);
    expect(db.all('SELECT * FROM review_logs')).toHaveLength(0);
  });

  it('geçersiz değerleri reddeder', () => {
    const folderId = insertFolder();
    expect(() =>
      db.run(
        `INSERT INTO questions (folder_id, question_image, correct_answer, next_review_date, created_at, updated_at)
         VALUES (?, 'q.jpg', 'F', '2026-10-07', ?, ?)`,
        folderId,
        now,
        now,
      ),
    ).toThrow();
    expect(() => db.run('UPDATE settings SET target_repetitions = 11')).toThrow();
    expect(() => db.run('UPDATE settings SET target_repetitions = 2')).toThrow();
    expect(() => db.run("INSERT INTO error_tags (name) VALUES ('Dikkatsizlik')")).toThrow();
  });

  it('kullanıcı kendi etiketini ekleyebilir', () => {
    db.run("INSERT INTO error_tags (name) VALUES ('Formülü unuttum')");
    const custom = db.all<ErrorTagRow>('SELECT * FROM error_tags WHERE is_default = 0');
    expect(custom.map((t) => t.name)).toEqual(['Formülü unuttum']);
  });
});
