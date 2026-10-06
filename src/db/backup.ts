/**
 * Yedek için veritabanı dışa/içe aktarımı. Sütun listeleri sabittir: yedek dosyasındaki
 * beklenmeyen alanlar SQL'e asla geçmez.
 */
import type { Database } from './database';
import type { ErrorTagRow, FolderRow, QuestionRow, QuestionTagRow, ReviewLogRow, SettingsRow } from './types';

export type BackupData = {
  settings: SettingsRow;
  folders: FolderRow[];
  questions: QuestionRow[];
  error_tags: ErrorTagRow[];
  question_tags: QuestionTagRow[];
  review_logs: ReviewLogRow[];
};

const COLUMNS = {
  folders: ['id', 'name', 'parent_id', 'color', 'sort_order', 'created_at'],
  questions: [
    'id',
    'folder_id',
    'question_image',
    'solution_image',
    'correct_answer',
    'note',
    'source_name',
    'source_page',
    'success_count',
    'next_review_date',
    'last_result',
    'completed_at',
    'created_at',
    'updated_at',
  ],
  error_tags: ['id', 'name', 'is_default'],
  question_tags: ['question_id', 'tag_id'],
  review_logs: ['id', 'question_id', 'reviewed_at', 'review_date', 'result', 'counted'],
} as const;

const SETTINGS_COLUMNS = [
  'name',
  'exam_type',
  'target_repetitions',
  'exam_date',
  'notifications_enabled',
  'notification_time',
  'last_backup_at',
  'onboarding_done',
] as const;

type BindValue = string | number | null;

export async function exportData(db: Database): Promise<BackupData> {
  const all = <T>(sql: string) => db.getAllAsync<T>(sql, []);
  const settings = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1', []);
  if (!settings) throw new Error('Ayarlar okunamadı.');
  return {
    settings,
    // Dersler konulardan önce gelir (içe aktarırken üst klasör önce eklenir).
    folders: await all<FolderRow>('SELECT * FROM folders ORDER BY parent_id IS NOT NULL, id'),
    questions: await all<QuestionRow>('SELECT * FROM questions ORDER BY id'),
    error_tags: await all<ErrorTagRow>('SELECT * FROM error_tags ORDER BY id'),
    question_tags: await all<QuestionTagRow>('SELECT * FROM question_tags ORDER BY question_id, tag_id'),
    review_logs: await all<ReviewLogRow>('SELECT * FROM review_logs ORDER BY id'),
  };
}

export function photoPathsOf(data: Pick<BackupData, 'questions'>): string[] {
  return data.questions.flatMap((q) => (q.solution_image ? [q.question_image, q.solution_image] : [q.question_image]));
}

/** Yedek verisinin yapısını kabaca doğrular (tablolar dizi mi, ayarlar var mı). */
export function isBackupData(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.settings === 'object' &&
    v.settings !== null &&
    (['folders', 'questions', 'error_tags', 'question_tags', 'review_logs'] as const).every((t) => Array.isArray(v[t]))
  );
}

async function insertRows(db: Database, table: keyof typeof COLUMNS, rows: readonly object[]): Promise<void> {
  const columns = COLUMNS[table];
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    await db.runAsync(
      sql,
      columns.map((c) => (record[c] ?? null) as BindValue),
    );
  }
}

/**
 * Mevcut tüm verinin yerine yedeği yazar (tek transaction). Herhangi bir satır geçersizse
 * (yabancı anahtar, CHECK kısıtı) tamamı geri alınır ve mevcut veri olduğu gibi kalır.
 * lastBackupAt: geri yüklenen veri en son bu yedek kadar güvende olduğu için "son yedek" o tarihe çekilir.
 */
export async function importData(db: Database, data: BackupData, lastBackupAt: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM review_logs', []);
    await db.runAsync('DELETE FROM question_tags', []);
    await db.runAsync('DELETE FROM questions', []);
    await db.runAsync('DELETE FROM folders WHERE parent_id IS NOT NULL', []);
    await db.runAsync('DELETE FROM folders', []);
    await db.runAsync('DELETE FROM error_tags', []);

    await insertRows(db, 'error_tags', data.error_tags);
    const parentsFirst = [...data.folders].sort((a, b) => Number(a.parent_id !== null) - Number(b.parent_id !== null));
    await insertRows(db, 'folders', parentsFirst);
    await insertRows(db, 'questions', data.questions);
    await insertRows(db, 'question_tags', data.question_tags);
    await insertRows(db, 'review_logs', data.review_logs);

    const settings = { ...data.settings, last_backup_at: lastBackupAt, onboarding_done: 1 } as Record<string, unknown>;
    await db.runAsync(
      `UPDATE settings SET ${SETTINGS_COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = 1`,
      SETTINGS_COLUMNS.map((c) => (settings[c] ?? null) as BindValue),
    );
  });
}

export async function markBackupDone(db: Database, now: string): Promise<void> {
  await db.runAsync('UPDATE settings SET last_backup_at = ? WHERE id = 1', [now]);
}

export async function countQuestions(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM questions', []);
  return row?.n ?? 0;
}
