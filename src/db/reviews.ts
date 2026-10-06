import { applyReview, type ReviewOutcome, type ReviewResult, type ReviewState } from '@/domain/spacedRepetition';
import type { LocalDate } from '@/lib/date';

import type { Database } from './database';
import { splitTags, TAG_COLUMNS, type QuestionDetail, type TagAggregates } from './questions';
import type { QuestionRow, Timestamp } from './types';

export type ReviewItem = QuestionDetail;

/** Oturum kaynağı: bugün tekrar edilecekler (isteğe bağlı bir klasörle sınırlı) ya da serbest çalışma. */
export type ReviewSource = { kind: 'due'; folderId: number | null } | { kind: 'free'; folderId: number };

/** Klasör filtresi: verilen klasör ve (ders ise) konuları. */
const FOLDER_FILTER = `(? IS NULL OR q.folder_id = ? OR q.folder_id IN (SELECT id FROM folders WHERE parent_id = ?))`;

/**
 * Oturum soruları. "due": günü gelmiş/geçmiş aktif sorular, en uzun bekleyen önce.
 * "free": klasördeki tüm aktif sorular (sadece günü gelmiş olanlar sayaca işler).
 */
export async function listReviewItems(db: Database, source: ReviewSource, today: LocalDate): Promise<ReviewItem[]> {
  const dueSql = source.kind === 'due' ? 'AND q.next_review_date <= ?' : '';
  const params = source.kind === 'due' ? [today] : [];
  const rows = await db.getAllAsync<QuestionRow & TagAggregates & { folder_name: string; parent_folder_name: string | null }>(
    `SELECT q.*, f.name AS folder_name, p.name AS parent_folder_name, ${TAG_COLUMNS}
     FROM questions q
     JOIN folders f ON f.id = q.folder_id
     LEFT JOIN folders p ON p.id = f.parent_id
     WHERE q.completed_at IS NULL ${dueSql} AND ${FOLDER_FILTER}
     ORDER BY q.next_review_date ASC, q.id ASC`,
    [...params, source.folderId, source.folderId, source.folderId],
  );
  return rows.map(splitTags);
}

/** Bugün tekrar edilecek soru sayısı (isteğe bağlı klasör + konuları). */
export async function countDue(db: Database, today: LocalDate, folderId: number | null = null): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM questions q
     WHERE q.completed_at IS NULL AND q.next_review_date <= ? AND ${FOLDER_FILTER}`,
    [today, folderId, folderId, folderId],
  );
  return row?.n ?? 0;
}

/** Klasördeki (konular dahil) aktif soru sayısı — serbest çalışma için. */
export async function countActive(db: Database, folderId: number): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM questions q WHERE q.completed_at IS NULL AND ${FOLDER_FILTER}`,
    [folderId, folderId, folderId],
  );
  return row?.n ?? 0;
}

export type RecordedReview = ReviewOutcome & {
  logId: number;
  questionId: number;
  previous: ReviewState;
  result: ReviewResult;
};

function stateOf(row: QuestionRow): ReviewState {
  return {
    success_count: row.success_count,
    next_review_date: row.next_review_date,
    last_result: row.last_result,
    completed_at: row.completed_at,
  };
}

async function writeState(db: Database, id: number, state: ReviewState, now: Timestamp): Promise<void> {
  await db.runAsync(
    `UPDATE questions SET success_count = ?, next_review_date = ?, last_result = ?, completed_at = ?, updated_at = ?
     WHERE id = ?`,
    [state.success_count, state.next_review_date, state.last_result, state.completed_at, now, id],
  );
}

/**
 * Bir tekrarı kaydeder: güncel durumu veritabanından okur, kuralı uygular,
 * soruyu günceller ve review_logs'a yazar — hepsi tek transaction.
 */
export async function recordReview(
  db: Database,
  questionId: number,
  result: ReviewResult,
  target: number,
  today: LocalDate,
  now: Timestamp,
): Promise<RecordedReview> {
  let recorded: RecordedReview | null = null;
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<QuestionRow>('SELECT * FROM questions WHERE id = ?', [questionId]);
    if (!row) throw new Error('Soru bulunamadı.');
    const previous = stateOf(row);
    const outcome = applyReview(previous, result, target, today, now);
    if (outcome.counted) await writeState(db, questionId, outcome.next, now);
    const log = await db.runAsync(
      'INSERT INTO review_logs (question_id, reviewed_at, review_date, result, counted) VALUES (?, ?, ?, ?, ?)',
      [questionId, now, today, result, outcome.counted ? 1 : 0],
    );
    recorded = { ...outcome, logId: log.lastInsertRowId, questionId, previous, result };
  });
  if (!recorded) throw new Error('Tekrar kaydedilemedi.');
  return recorded;
}

/** Son tekrarı geri alır: sorunun önceki durumu geri yüklenir ve tekrar kaydı silinir. */
export async function undoReview(db: Database, recorded: RecordedReview, now: Timestamp): Promise<void> {
  await db.withTransactionAsync(async () => {
    if (recorded.counted) await writeState(db, recorded.questionId, recorded.previous, now);
    await db.runAsync('DELETE FROM review_logs WHERE id = ?', [recorded.logId]);
  });
}

/** Tekrar yapılan günler (en yeni önce) — seri hesabı için. */
export async function listReviewDays(db: Database, limit = 400): Promise<LocalDate[]> {
  const rows = await db.getAllAsync<{ review_date: LocalDate }>(
    'SELECT DISTINCT review_date FROM review_logs ORDER BY review_date DESC LIMIT ?',
    [limit],
  );
  return rows.map((r) => r.review_date);
}
