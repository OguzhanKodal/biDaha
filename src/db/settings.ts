import type { SQLiteDatabase } from 'expo-sqlite';

import type { SettingsRow } from './types';

export async function getSettings(db: SQLiteDatabase): Promise<SettingsRow> {
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  if (!row) throw new Error('Ayarlar satırı bulunamadı.');
  return row;
}
