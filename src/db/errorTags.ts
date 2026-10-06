import type { Database } from './database';
import type { ErrorTagRow } from './types';

/** Önce hazır etiketler, sonra kullanıcının ekledikleri. */
export async function listErrorTags(db: Database): Promise<ErrorTagRow[]> {
  return db.getAllAsync<ErrorTagRow>('SELECT * FROM error_tags ORDER BY is_default DESC, id', []);
}

/** Kullanıcı etiketi ekler (ad doğrulaması çağıran tarafta: validateTagName). */
export async function createErrorTag(db: Database, name: string): Promise<number> {
  const result = await db.runAsync('INSERT INTO error_tags (name, is_default) VALUES (?, 0)', [name.trim()]);
  return result.lastInsertRowId;
}
