import type { SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './migrate';

export const DATABASE_NAME = 'bidaha.db';

/** SQLiteProvider `onInit`: bağlantı ayarları + bekleyen migration'lar. */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
}
