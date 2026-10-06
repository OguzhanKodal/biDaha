import type { ExamType } from '@/domain/examPresets';
import type { AnswerChoice } from '@/domain/questions';
import type { LocalDate } from '@/lib/date';
import type { FolderColor } from '@/theme/colors';

/** ISO 8601 zaman damgası. */
export type Timestamp = string;
export type SqlBoolean = 0 | 1;
export type ReviewResult = 'success' | 'fail';
export type { AnswerChoice };

export type SettingsRow = {
  id: 1;
  name: string | null;
  exam_type: ExamType | null;
  target_repetitions: number;
  exam_date: LocalDate | null;
  notifications_enabled: SqlBoolean;
  /** `HH:mm` */
  notification_time: string;
  last_backup_at: Timestamp | null;
  onboarding_done: SqlBoolean;
};

export type FolderRow = {
  id: number;
  name: string;
  parent_id: number | null;
  color: FolderColor;
  sort_order: number;
  created_at: Timestamp;
};

export type QuestionRow = {
  id: number;
  folder_id: number;
  /** Uygulama klasörüne göre göreli yol. */
  question_image: string;
  solution_image: string | null;
  correct_answer: AnswerChoice | null;
  note: string | null;
  source_name: string | null;
  source_page: string | null;
  success_count: number;
  next_review_date: LocalDate;
  last_result: ReviewResult | null;
  completed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ErrorTagRow = {
  id: number;
  name: string;
  is_default: SqlBoolean;
};

export type QuestionTagRow = {
  question_id: number;
  tag_id: number;
};

export type ReviewLogRow = {
  id: number;
  question_id: number;
  reviewed_at: Timestamp;
  review_date: LocalDate;
  result: ReviewResult;
  counted: SqlBoolean;
};
