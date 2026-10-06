import type { Database } from './database';
import type { ErrorTagRow } from './types';

/** Önce hazır etiketler, sonra kullanıcının ekledikleri. */
export async function listErrorTags(db: Database): Promise<ErrorTagRow[]> {
  return db.getAllAsync<ErrorTagRow>('SELECT * FROM error_tags ORDER BY is_default DESC, id', []);
}
