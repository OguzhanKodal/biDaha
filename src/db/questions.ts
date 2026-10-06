import { initialSchedule, type QuestionSort, type QuestionStatusFilter } from '@/domain/questions';
import type { LocalDate } from '@/lib/date';

import type { Database } from './database';
import type { AnswerChoice, QuestionRow, Timestamp } from './types';

/** Formdan gelen, kaydedilmeye hazır alanlar. Fotoğraflar uygulama klasörüne göre göreli yoldur. */
export type QuestionInput = {
  folderId: number;
  questionImage: string;
  solutionImage: string | null;
  correctAnswer: AnswerChoice | null;
  note: string | null;
  sourceName: string | null;
  sourcePage: string | null;
  tagIds: number[];
};

async function replaceTags(db: Database, questionId: number, tagIds: readonly number[]): Promise<void> {
  await db.runAsync('DELETE FROM question_tags WHERE question_id = ?', [questionId]);
  for (const tagId of new Set(tagIds)) {
    await db.runAsync('INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)', [questionId, tagId]);
  }
}

export async function insertQuestion(
  db: Database,
  input: QuestionInput,
  now: Timestamp,
  today: LocalDate,
): Promise<number> {
  const schedule = initialSchedule(today);
  let id = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO questions (folder_id, question_image, solution_image, correct_answer, note, source_name,
         source_page, success_count, next_review_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.folderId,
        input.questionImage,
        input.solutionImage,
        input.correctAnswer,
        input.note,
        input.sourceName,
        input.sourcePage,
        schedule.success_count,
        schedule.next_review_date,
        now,
        now,
      ],
    );
    id = result.lastInsertRowId;
    await replaceTags(db, id, input.tagIds);
  });
  return id;
}

/** İçerik alanlarını günceller; tekrar durumu (başarı, tarih) değişmez. */
export async function updateQuestion(db: Database, id: number, input: QuestionInput, now: Timestamp): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE questions SET folder_id = ?, question_image = ?, solution_image = ?, correct_answer = ?, note = ?,
         source_name = ?, source_page = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.folderId,
        input.questionImage,
        input.solutionImage,
        input.correctAnswer,
        input.note,
        input.sourceName,
        input.sourcePage,
        now,
        id,
      ],
    );
    await replaceTags(db, id, input.tagIds);
  });
}

export async function setSolutionImage(db: Database, id: number, solutionImage: string, now: Timestamp): Promise<void> {
  await db.runAsync('UPDATE questions SET solution_image = ?, updated_at = ? WHERE id = ?', [solutionImage, now, id]);
}

export type QuestionDetail = QuestionRow & {
  folder_name: string;
  parent_folder_name: string | null;
  tag_ids: number[];
  tag_names: string[];
};

const TAG_SEPARATOR = '\u001f';

type TagAggregates = { tag_ids_csv: string | null; tag_names_joined: string | null };

function splitTags<T extends TagAggregates>(row: T): Omit<T, keyof TagAggregates> & { tag_ids: number[]; tag_names: string[] } {
  const { tag_ids_csv, tag_names_joined, ...rest } = row;
  return {
    ...rest,
    tag_ids: tag_ids_csv ? tag_ids_csv.split(',').map(Number) : [],
    tag_names: tag_names_joined ? tag_names_joined.split(TAG_SEPARATOR) : [],
  };
}

const TAG_COLUMNS = `
  (SELECT GROUP_CONCAT(t.id) FROM (
     SELECT et.id FROM question_tags qt JOIN error_tags et ON et.id = qt.tag_id
     WHERE qt.question_id = q.id ORDER BY et.is_default DESC, et.id) t) AS tag_ids_csv,
  (SELECT GROUP_CONCAT(t.name, '${TAG_SEPARATOR}') FROM (
     SELECT et.name FROM question_tags qt JOIN error_tags et ON et.id = qt.tag_id
     WHERE qt.question_id = q.id ORDER BY et.is_default DESC, et.id) t) AS tag_names_joined`;

export async function getQuestion(db: Database, id: number): Promise<QuestionDetail | null> {
  const row = await db.getFirstAsync<QuestionRow & TagAggregates & { folder_name: string; parent_folder_name: string | null }>(
    `SELECT q.*, f.name AS folder_name, p.name AS parent_folder_name, ${TAG_COLUMNS}
     FROM questions q
     JOIN folders f ON f.id = q.folder_id
     LEFT JOIN folders p ON p.id = f.parent_id
     WHERE q.id = ?`,
    [id],
  );
  return row ? splitTags(row) : null;
}

export type QuestionListItem = QuestionRow & {
  fail_count: number;
  tag_ids: number[];
  tag_names: string[];
};

const SORT_SQL: Record<QuestionSort, string> = {
  nextReview: 'q.next_review_date ASC, q.id ASC',
  createdAt: 'q.created_at DESC, q.id DESC',
  mostFailed: 'fail_count DESC, q.next_review_date ASC, q.id ASC',
};

/** Bir klasöre doğrudan eklenmiş sorular (konulardakiler hariç). */
export async function listQuestions(
  db: Database,
  folderId: number,
  status: QuestionStatusFilter,
  sort: QuestionSort,
): Promise<QuestionListItem[]> {
  const statusSql = status === 'active' ? 'q.completed_at IS NULL' : 'q.completed_at IS NOT NULL';
  const orderSql = status === 'completed' && sort === 'nextReview' ? 'q.completed_at DESC, q.id DESC' : SORT_SQL[sort];
  const rows = await db.getAllAsync<QuestionRow & TagAggregates & { fail_count: number }>(
    `SELECT q.*, ${TAG_COLUMNS},
       (SELECT COUNT(*) FROM review_logs r WHERE r.question_id = q.id AND r.result = 'fail') AS fail_count
     FROM questions q
     WHERE q.folder_id = ? AND ${statusSql}
     ORDER BY ${orderSql}`,
    [folderId],
  );
  return rows.map(splitTags);
}

export async function countQuestionsByStatus(
  db: Database,
  folderId: number,
): Promise<{ active: number; completed: number }> {
  const row = await db.getFirstAsync<{ active: number; completed: number }>(
    `SELECT COALESCE(SUM(completed_at IS NULL), 0) AS active, COALESCE(SUM(completed_at IS NOT NULL), 0) AS completed
     FROM questions WHERE folder_id = ?`,
    [folderId],
  );
  return row ?? { active: 0, completed: 0 };
}

/** En son kullanılan kaynak adları (en yeni önce, tekrarsız). */
export async function listRecentSources(db: Database, limit = 20): Promise<string[]> {
  const rows = await db.getAllAsync<{ source_name: string }>(
    `SELECT source_name FROM questions
     WHERE source_name IS NOT NULL
     GROUP BY source_name
     ORDER BY MAX(updated_at) DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => r.source_name);
}

/**
 * Soruyu siler (etiket bağları ve tekrar kayıtları CASCADE ile gider).
 * Fotoğraf yollarını döner; dosyalar kayıt silindikten SONRA silinmeli.
 */
export async function deleteQuestion(db: Database, id: number): Promise<string[]> {
  let photos: string[] = [];
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<{ question_image: string; solution_image: string | null }>(
      'SELECT question_image, solution_image FROM questions WHERE id = ?',
      [id],
    );
    if (!row) return;
    photos = row.solution_image ? [row.question_image, row.solution_image] : [row.question_image];
    await db.runAsync('DELETE FROM questions WHERE id = ?', [id]);
  });
  return photos;
}

/** Veritabanında kayıtlı tüm fotoğraf yolları (yetim dosya temizliği için). */
export async function listAllPhotoPaths(db: Database): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ path: string }>(
    `SELECT question_image AS path FROM questions
     UNION SELECT solution_image FROM questions WHERE solution_image IS NOT NULL`,
    [],
  );
  return new Set(rows.map((r) => r.path));
}
