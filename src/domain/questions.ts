import { addDays, daysBetween, type LocalDate } from '@/lib/date';

import { normalizeName } from './names';

export const answerChoices = ['A', 'B', 'C', 'D', 'E'] as const;
export type AnswerChoice = (typeof answerChoices)[number];

export type QuestionStatusFilter = 'active' | 'completed';

export const questionSorts = ['nextReview', 'createdAt', 'mostFailed'] as const;
export type QuestionSort = (typeof questionSorts)[number];

export const questionSortLabels: Record<QuestionSort, string> = {
  nextReview: 'Tekrar tarihi',
  createdAt: 'Eklenme tarihi',
  mostFailed: 'En çok çözülemeyen',
};

/** SPEC §5: yeni soru → başarı 0, sonraki tekrar yarın. */
export function initialSchedule(today: LocalDate): { success_count: number; next_review_date: LocalDate } {
  return { success_count: 0, next_review_date: addDays(today, 1) };
}

/** İlerleme rozeti: "2/5". Tekrar sayısı düşürülmüşse başarı hedefi aşmaz. */
export function progressLabel(successCount: number, target: number): string {
  return `${Math.min(successCount, target)}/${target}`;
}

/** Sonraki tekrar metni. Günü geçmiş sorular da "Bugün" (SPEC §5: gecikmeye ceza yok). */
export function nextReviewLabel(nextReview: LocalDate, today: LocalDate): string {
  const days = daysBetween(today, nextReview);
  if (days <= 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  return `${days} gün sonra`;
}

export function isDue(nextReview: LocalDate, today: LocalDate): boolean {
  return daysBetween(today, nextReview) <= 0;
}

/** Boş/boşluk metni null'a çevirir (isteğe bağlı alanlar). */
export function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

/** Kaynak önerileri: yazılan metinle başlayan ya da içeren son kaynaklar (yazılanla birebir aynı olan hariç). */
export function filterSourceSuggestions(recent: readonly string[], input: string, limit = 5): string[] {
  const query = normalizeName(input);
  const matches = recent.filter((name) => {
    const normalized = normalizeName(name);
    return normalized !== query && (query === '' || normalized.includes(query));
  });
  return matches.slice(0, limit);
}

export type QuestionDraftError = 'missingPhoto' | 'missingFolder';

export const questionDraftErrorMessages: Record<QuestionDraftError, string> = {
  missingPhoto: 'Soru fotoğrafı eklemelisin.',
  missingFolder: 'Bir klasör seçmelisin.',
};

export function validateQuestionDraft(draft: { hasQuestionPhoto: boolean; folderId: number | null }): QuestionDraftError[] {
  const errors: QuestionDraftError[] = [];
  if (!draft.hasQuestionPhoto) errors.push('missingPhoto');
  if (draft.folderId === null) errors.push('missingFolder');
  return errors;
}
