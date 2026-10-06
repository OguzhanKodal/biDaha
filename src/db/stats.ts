import type { DailyReviewRow, TagCount } from '@/domain/stats';
import type { LocalDate } from '@/lib/date';

import type { Database } from './database';

/** Kapsam: tüm sorular (null) ya da bir ders + konuları / bir konu. */
const SCOPE = `SELECT q.id FROM questions q
  WHERE ? IS NULL OR q.folder_id = ? OR q.folder_id IN (SELECT id FROM folders WHERE parent_id = ?)`;

export type TagStats = { questionCount: number; untagged: number; tags: TagCount[] };

/** Her hata nedeninin kaç soruda seçildiği (kapsamdaki tüm sorular, tamamlananlar dahil). */
export async function getTagStats(db: Database, folderId: number | null): Promise<TagStats> {
  const scopeParams = [folderId, folderId, folderId];
  const tags = await db.getAllAsync<TagCount>(
    `SELECT et.id, et.name, COUNT(qt.question_id) AS count
     FROM error_tags et
     LEFT JOIN question_tags qt ON qt.tag_id = et.id AND qt.question_id IN (${SCOPE})
     GROUP BY et.id
     ORDER BY et.is_default DESC, et.id`,
    scopeParams,
  );
  const totals = await db.getFirstAsync<{ questionCount: number; untagged: number }>(
    `SELECT COUNT(*) AS questionCount,
       COALESCE(SUM(NOT EXISTS (SELECT 1 FROM question_tags qt WHERE qt.question_id = s.id)), 0) AS untagged
     FROM (${SCOPE}) s`,
    scopeParams,
  );
  return { questionCount: totals?.questionCount ?? 0, untagged: totals?.untagged ?? 0, tags };
}

/** Gün gün tekrar sayıları (serbest çalışma dahil), from günü ve sonrası. */
export async function listDailyReviews(db: Database, from: LocalDate): Promise<DailyReviewRow[]> {
  return db.getAllAsync<DailyReviewRow>(
    `SELECT review_date, COUNT(*) AS total, COALESCE(SUM(result = 'success'), 0) AS solved
     FROM review_logs WHERE review_date >= ?
     GROUP BY review_date ORDER BY review_date`,
    [from],
  );
}
