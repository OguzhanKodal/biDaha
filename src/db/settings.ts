import type { ExamType } from '@/domain/examPresets';
import { presetFolders } from '@/domain/folders';
import type { CompletedOnboarding } from '@/domain/onboarding';
import type { DueGroup } from '@/domain/reminders';
import type { LocalDate } from '@/lib/date';

import type { Database } from './database';
import { insertPresetFolders } from './folders';
import type { SettingsRow, Timestamp } from './types';

export async function getSettings(db: Database): Promise<SettingsRow> {
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1', []);
  if (!row) throw new Error('Ayarlar satırı bulunamadı.');
  return row;
}

/**
 * Onboarding cevaplarını kaydeder ve sınavın hazır derslerini oluşturur (tek transaction).
 * Onboarding zaten tamamlandıysa hiçbir şey yapmaz; dersler iki kez eklenmez.
 */
export async function completeOnboarding(
  db: Database,
  answers: CompletedOnboarding,
  now: Timestamp,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `UPDATE settings
       SET name = ?, exam_type = ?, target_repetitions = ?, exam_date = ?,
           notification_time = ?, notifications_enabled = ?, onboarding_done = 1
       WHERE id = 1 AND onboarding_done = 0`,
      [
        answers.name,
        answers.exam,
        answers.repetitions,
        answers.examDate,
        answers.reminderTime,
        answers.remindersEnabled ? 1 : 0,
      ],
    );
    if (result.changes === 0) return;
    await insertPresetFolders(db, presetFolders(answers.exam), now);
  });
}

/** Ad, sınav, tarih ve bildirim ayarları (tekrar sayısı hariç: changeTargetRepetitions). */
export type SettingsChanges = Partial<{
  name: string;
  exam_type: ExamType;
  exam_date: LocalDate | null;
  notifications_enabled: boolean;
  notification_time: string;
}>;

const SETTINGS_COLUMNS = ['name', 'exam_type', 'exam_date', 'notifications_enabled', 'notification_time'] as const;

export async function updateSettings(db: Database, changes: SettingsChanges): Promise<void> {
  const keys = SETTINGS_COLUMNS.filter((key) => changes[key] !== undefined);
  if (keys.length === 0) return;
  const values = keys.map((key) => {
    const value = changes[key];
    return typeof value === 'boolean' ? (value ? 1 : 0) : (value ?? null);
  });
  await db.runAsync(`UPDATE settings SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = 1`, values);
}

/** Yeni N ile tamamlanmış sayılacak aktif soru sayısı (N düşürülmeden önce kullanıcıya gösterilir). */
export async function countCompletedByTarget(db: Database, target: number): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM questions WHERE completed_at IS NULL AND success_count >= ?',
    [target],
  );
  return row?.n ?? 0;
}

/**
 * Tekrar sayısını (N) değiştirir (SPEC §5). Başarısı yeni N'e ulaşan aktif sorular tamamlanır.
 * N artarsa tamamlanmış sorular tamamlanmış kalır. Tek transaction; tamamlanan soru sayısını döner.
 */
export async function changeTargetRepetitions(db: Database, target: number, now: Timestamp): Promise<number> {
  let completed = 0;
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE settings SET target_repetitions = ? WHERE id = 1', [target]);
    const result = await db.runAsync(
      `UPDATE questions SET completed_at = ?, updated_at = ?
       WHERE completed_at IS NULL AND success_count >= ?`,
      [now, now, target],
    );
    completed = result.changes;
  });
  return completed;
}

/** Aktif soruların tekrar günlerine göre dağılımı (bildirim planı için). */
export async function listDueGroups(db: Database): Promise<DueGroup[]> {
  return db.getAllAsync<DueGroup>(
    `SELECT next_review_date, COUNT(*) AS count FROM questions
     WHERE completed_at IS NULL GROUP BY next_review_date`,
    [],
  );
}

/**
 * Tüm verileri siler ve ayarları varsayılana döndürür (onboarding baştan başlar). Hazır etiketler kalır.
 * Fotoğraf dosyalarını çağıran taraf siler (deleteAllPhotoFiles), kayıtlar silindikten SONRA.
 */
export async function resetAllData(db: Database): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM review_logs', []);
    await db.runAsync('DELETE FROM question_tags', []);
    await db.runAsync('DELETE FROM questions', []);
    await db.runAsync('DELETE FROM folders WHERE parent_id IS NOT NULL', []);
    await db.runAsync('DELETE FROM folders', []);
    await db.runAsync('DELETE FROM error_tags WHERE is_default = 0', []);
    await db.runAsync(
      `UPDATE settings SET name = NULL, exam_type = NULL, target_repetitions = 5, exam_date = NULL,
         notifications_enabled = 0, notification_time = '20:00', last_backup_at = NULL, onboarding_done = 0
       WHERE id = 1`,
      [],
    );
  });
}

/** SADECE GELİŞTİRME: tüm aktif soruları bugün tekrar edilecek hale getirir (tekrar ekranını denemek için). */
export async function devMakeAllDue(db: Database, today: string): Promise<number> {
  if (!__DEV__) throw new Error('Sadece geliştirme sürümünde kullanılabilir.');
  const result = await db.runAsync('UPDATE questions SET next_review_date = ? WHERE completed_at IS NULL', [today]);
  return result.changes;
}
