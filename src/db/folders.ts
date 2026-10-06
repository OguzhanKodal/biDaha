import type { FolderStats, NewFolder } from '@/domain/folders';
import type { LocalDate } from '@/lib/date';
import type { FolderColor } from '@/theme/colors';

import type { Database } from './database';
import type { FolderRow, Timestamp } from './types';

export type FolderWithStats = FolderRow &
  FolderStats & {
    topic_count: number;
  };

/**
 * Bir seviyedeki klasörler (parentId = null → dersler), sayılarla birlikte.
 * Bir dersin sayılarına konularındaki sorular da dahildir.
 */
export async function listFolders(
  db: Database,
  parentId: number | null,
  today: LocalDate,
): Promise<FolderWithStats[]> {
  return db.getAllAsync<FolderWithStats>(
    `SELECT f.*,
       (SELECT COUNT(*) FROM folders c WHERE c.parent_id = f.id) AS topic_count,
       COUNT(q.id) AS total,
       COALESCE(SUM(q.completed_at IS NULL AND q.next_review_date <= ?), 0) AS due,
       COALESCE(SUM(q.completed_at IS NOT NULL), 0) AS completed
     FROM folders f
     LEFT JOIN questions q
       ON q.folder_id = f.id
       OR q.folder_id IN (SELECT c.id FROM folders c WHERE c.parent_id = f.id)
     WHERE f.parent_id IS ?
     GROUP BY f.id
     ORDER BY f.sort_order, f.id`,
    [today, parentId],
  );
}

export async function getFolder(db: Database, id: number): Promise<FolderRow | null> {
  return db.getFirstAsync<FolderRow>('SELECT * FROM folders WHERE id = ?', [id]);
}

/** Aynı seviyedeki diğer klasörlerin adları (ad çakışması kontrolü için). */
export async function listSiblingNames(
  db: Database,
  parentId: number | null,
  excludeId: number | null = null,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    'SELECT name FROM folders WHERE parent_id IS ? AND id IS NOT ?',
    [parentId, excludeId],
  );
  return rows.map((r) => r.name);
}

export async function countFolders(db: Database, parentId: number | null): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM folders WHERE parent_id IS ?',
    [parentId],
  );
  return row?.n ?? 0;
}

export async function createFolder(
  db: Database,
  folder: { name: string; color: FolderColor; parentId: number | null },
  now: Timestamp,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO folders (name, parent_id, color, sort_order, created_at)
     VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order) + 1, 0) FROM folders WHERE parent_id IS ?), ?)`,
    [folder.name.trim(), folder.parentId, folder.color, folder.parentId, now],
  );
  return result.lastInsertRowId;
}

/** Onboarding'de hazır dersleri ekler. Transaction çağıran tarafta açılır. */
export async function insertPresetFolders(
  db: Database,
  folders: readonly NewFolder[],
  now: Timestamp,
): Promise<void> {
  for (const folder of folders) {
    await db.runAsync(
      'INSERT INTO folders (name, parent_id, color, sort_order, created_at) VALUES (?, NULL, ?, ?, ?)',
      [folder.name, folder.color, folder.sortOrder, now],
    );
  }
}

export async function updateFolder(
  db: Database,
  id: number,
  changes: { name: string; color: FolderColor },
): Promise<void> {
  await db.runAsync('UPDATE folders SET name = ?, color = ? WHERE id = ?', [
    changes.name.trim(),
    changes.color,
    id,
  ]);
}

/** Verilen sıraya göre sort_order'ı 0'dan yeniden yazar. */
export async function reorderFolders(db: Database, orderedIds: readonly number[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db.runAsync('UPDATE folders SET sort_order = ? WHERE id = ?', [index, id]);
    }
  });
}

export type FolderDeleteInfo = {
  topicCount: number;
  /** Klasörün ve konularının toplam soru sayısı. */
  questionCount: number;
};

export async function getFolderDeleteInfo(db: Database, id: number): Promise<FolderDeleteInfo> {
  const row = await db.getFirstAsync<FolderDeleteInfo>(
    `SELECT
       (SELECT COUNT(*) FROM folders WHERE parent_id = ?) AS topicCount,
       (SELECT COUNT(*) FROM questions
         WHERE folder_id = ? OR folder_id IN (SELECT id FROM folders WHERE parent_id = ?)) AS questionCount`,
    [id, id, id],
  );
  return row ?? { topicCount: 0, questionCount: 0 };
}

/**
 * Klasörü ve konularını siler. İçlerinde soru varsa veritabanı reddeder (ON DELETE RESTRICT)
 * ve hiçbir şey silinmez; önce soruları taşımak ya da silmek gerekir.
 */
export async function deleteFolder(db: Database, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM folders WHERE parent_id = ?', [id]);
    await db.runAsync('DELETE FROM folders WHERE id = ?', [id]);
  });
}

/** Soru taşıma hedefleri: bu klasör ve konuları hariç tüm klasörler, ders › konu sırasıyla. */
export async function listMoveTargets(db: Database, excludeId: number): Promise<FolderRow[]> {
  return db.getAllAsync<FolderRow>(
    `SELECT f.* FROM folders f
     LEFT JOIN folders p ON p.id = f.parent_id
     WHERE f.id != ? AND f.parent_id IS NOT ?
     ORDER BY COALESCE(p.sort_order, f.sort_order), COALESCE(p.id, f.id), f.parent_id IS NOT NULL, f.sort_order, f.id`,
    [excludeId, excludeId],
  );
}

/** Klasörün (ve konularının) sorularını hedefe taşır, sonra klasörü siler. Hepsi tek transaction. */
export async function moveQuestionsAndDeleteFolder(
  db: Database,
  id: number,
  targetId: number,
  now: Timestamp,
): Promise<void> {
  const target = await getFolder(db, targetId);
  if (!target || target.id === id || target.parent_id === id) {
    throw new Error('Geçersiz hedef klasör.');
  }
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE questions SET folder_id = ?, updated_at = ?
       WHERE folder_id = ? OR folder_id IN (SELECT id FROM folders WHERE parent_id = ?)`,
      [targetId, now, id, id],
    );
    await db.runAsync('DELETE FROM folders WHERE parent_id = ?', [id]);
    await db.runAsync('DELETE FROM folders WHERE id = ?', [id]);
  });
}
