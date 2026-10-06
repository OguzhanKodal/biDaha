import { daysBetween, type LocalDate } from '@/lib/date';

import type { ExamType } from './examPresets';
import { validateName } from './names';

export const maxUserNameLength = 30;

export const minRepetitions = 3;
export const maxRepetitions = 10;
export const defaultRepetitions = 5;

export type OnboardingDraft = {
  name: string;
  exam: ExamType | null;
  repetitions: number;
  examDate: LocalDate | null;
};

export const emptyDraft: OnboardingDraft = {
  name: '',
  exam: null,
  repetitions: defaultRepetitions,
  examDate: null,
};

export type UserNameError = 'empty' | 'tooLong';

export function validateUserName(name: string): UserNameError | null {
  const error = validateName(name, maxUserNameLength);
  return error === 'duplicate' ? null : error;
}

export function clampRepetitions(value: number): number {
  return Math.min(maxRepetitions, Math.max(minRepetitions, Math.round(value)));
}

/** Sınav tarihi bugün ya da ileride olmalı. */
export function isValidExamDate(examDate: LocalDate, today: LocalDate): boolean {
  return daysBetween(today, examDate) >= 0;
}

export type CompletedOnboarding = {
  name: string;
  exam: ExamType;
  repetitions: number;
  examDate: LocalDate | null;
};

/** Taslak kaydedilmeye hazırsa temizlenmiş halini, değilse null döner. */
export function finalizeDraft(draft: OnboardingDraft, today: LocalDate): CompletedOnboarding | null {
  if (validateUserName(draft.name) !== null || draft.exam === null) return null;
  if (draft.examDate !== null && !isValidExamDate(draft.examDate, today)) return null;
  return {
    name: draft.name.trim(),
    exam: draft.exam,
    repetitions: clampRepetitions(draft.repetitions),
    examDate: draft.examDate,
  };
}
