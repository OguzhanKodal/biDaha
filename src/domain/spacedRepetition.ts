/**
 * Aralıklı tekrar (SPEC §5). Saf fonksiyonlar; tüm tarihler yerel gün (YYYY-MM-DD).
 *
 * Temel kural: Bir tekrar SADECE soru o gün tekrar günündeyse (sonraki tekrar ≤ bugün, tamamlanmamış)
 * sayılır — hangi ekrandan açıldığı fark etmez. Sayılmayan tekrar (serbest çalışma) sorunun
 * durumunu değiştirmez, sadece kaydedilir. Böylece aynı gün art arda tekrarla soru bitirilemez.
 */
import { addDays, daysBetween, type LocalDate } from '@/lib/date';

import { examLabels, type ExamType } from './examPresets';

export type ReviewResult = 'success' | 'fail';

export type ReviewState = {
  success_count: number;
  next_review_date: LocalDate;
  last_result: ReviewResult | null;
  /** ISO zaman damgası; null → aktif */
  completed_at: string | null;
};

/** SPEC: 1, 3, 7, 14, 30, 60, ... Sonrası ikiye katlanır, en fazla 120 gün. */
const baseIntervals = [1, 3, 7, 14, 30, 60] as const;
export const maxIntervalDays = 120;

/** başarı sayısı s'e ulaşan sorunun bir sonraki tekrarına kadar gün (s ≥ 1). */
export function intervalAfterSuccess(successCount: number): number {
  const index = Math.max(1, successCount);
  if (index < baseIntervals.length) return baseIntervals[index];
  const doubled = baseIntervals[baseIntervals.length - 1] * 2 ** (index - baseIntervals.length + 1);
  return Math.min(doubled, maxIntervalDays);
}

/** Bu tekrar sayaca işler mi? */
export function isCountable(state: ReviewState, today: LocalDate): boolean {
  return state.completed_at === null && daysBetween(today, state.next_review_date) <= 0;
}

export type ReviewOutcome = {
  next: ReviewState;
  counted: boolean;
  /** Bu tekrarla soru tamamlandı mı? */
  completedNow: boolean;
};

export function applyReview(
  state: ReviewState,
  result: ReviewResult,
  target: number,
  today: LocalDate,
  now: string,
): ReviewOutcome {
  if (!isCountable(state, today)) {
    return { next: state, counted: false, completedNow: false };
  }
  if (result === 'fail') {
    return {
      next: { ...state, last_result: 'fail', next_review_date: addDays(today, 1) },
      counted: true,
      completedNow: false,
    };
  }
  const successCount = state.success_count + 1;
  if (successCount >= target) {
    return {
      next: { ...state, success_count: successCount, last_result: 'success', completed_at: now },
      counted: true,
      completedNow: true,
    };
  }
  return {
    next: {
      ...state,
      success_count: successCount,
      last_result: 'success',
      next_review_date: addDays(today, intervalAfterSuccess(successCount)),
    },
    counted: true,
    completedNow: false,
  };
}

/** "Tekrar aktif et": başarı 0, yarına planlı. */
export function reactivatedState(today: LocalDate): ReviewState {
  return { success_count: 0, next_review_date: addDays(today, 1), last_result: null, completed_at: null };
}

/**
 * Seri: bugünden (bugün henüz tekrar yoksa dünden) geriye kesintisiz tekrar yapılan gün sayısı.
 * Serbest çalışma dahil her tekrar günü sayılır.
 */
export function streakDays(reviewDates: readonly LocalDate[], today: LocalDate): number {
  const days = new Set(reviewDates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function streakLabel(streak: number, reviewedToday: boolean): string | null {
  if (streak <= 0) return null;
  if (streak === 1) return reviewedToday ? 'Bugün tekrar yaptın, seri başladı' : 'Dün tekrar yaptın, seriyi bugün sürdür';
  return reviewedToday
    ? `${streak} gündür üst üste tekrar yapıyorsun`
    : `${streak} günlük serin var, bugün tekrar yaparak sürdür`;
}

/** "YKS'ye 247 gün". Sınav günü "… bugün", tarih geçtiyse null. */
export function examCountdownLabel(exam: ExamType | null, examDate: LocalDate | null, today: LocalDate): string | null {
  if (!examDate) return null;
  const days = daysBetween(today, examDate);
  if (days < 0) return null;
  const name = exam && exam !== 'OTHER' ? examLabels[exam] : null;
  if (days === 0) return name ? `${name} bugün, başarılar!` : 'Sınavın bugün, başarılar!';
  // YKS, DGS, KPSS harf okunuşları "-se" ile bittiği için hepsi "'ye" alır.
  return name ? `${name}'ye ${days} gün` : `Sınavına ${days} gün`;
}

export type SessionResult = { result: ReviewResult; counted: boolean; completedNow: boolean };

export function sessionSummary(results: readonly SessionResult[]) {
  return {
    total: results.length,
    solved: results.filter((r) => r.result === 'success').length,
    failed: results.filter((r) => r.result === 'fail').length,
    completed: results.filter((r) => r.completedNow).length,
    uncounted: results.filter((r) => !r.counted).length,
  };
}
