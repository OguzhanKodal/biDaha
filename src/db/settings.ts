import { presetFolders } from '@/domain/folders';
import type { CompletedOnboarding } from '@/domain/onboarding';

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
       SET name = ?, exam_type = ?, target_repetitions = ?, exam_date = ?, onboarding_done = 1
       WHERE id = 1 AND onboarding_done = 0`,
      [answers.name, answers.exam, answers.repetitions, answers.examDate],
    );
    if (result.changes === 0) return;
    await insertPresetFolders(db, presetFolders(answers.exam), now);
  });
}

/**
 * SADECE GELİŞTİRME: tüm verileri silip ayarları varsayılana döndürür.
 * Fotoğraf dosyaları henüz yok (Faz 2); o zaman buraya dosya silme de eklenmeli.
 */
export async function devResetAllData(db: Database): Promise<void> {
  if (!__DEV__) throw new Error('Sadece geliştirme sürümünde kullanılabilir.');
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
