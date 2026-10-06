import { daysBetween, type LocalDate } from '@/lib/date';

import type { ExamType } from './examPresets';
import { validateName } from './names';
import { defaultReminderTime, isValidTime } from './reminders';

export const maxUserNameLength = 30;

export const minRepetitions = 3;
export const maxRepetitions = 10;
export const defaultRepetitions = 5;

export type OnboardingDraft = {
  name: string;
  exam: ExamType | null;
  repetitions: number;
  examDate: LocalDate | null;
  /** Günlük hatırlatma saati (HH:mm) */
  reminderTime: string;
};

export const emptyDraft: OnboardingDraft = {
  name: '',
  exam: null,
  repetitions: defaultRepetitions,
  examDate: null,
  reminderTime: defaultReminderTime,
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
  reminderTime: string;
  remindersEnabled: boolean;
};

/** Taslak kaydedilmeye hazırsa temizlenmiş halini, değilse null döner. */
export function finalizeDraft(
  draft: OnboardingDraft,
  today: LocalDate,
  remindersEnabled = false,
): CompletedOnboarding | null {
  if (validateUserName(draft.name) !== null || draft.exam === null) return null;
  if (draft.examDate !== null && !isValidExamDate(draft.examDate, today)) return null;
  if (!isValidTime(draft.reminderTime)) return null;
  return {
    name: draft.name.trim(),
    exam: draft.exam,
    repetitions: clampRepetitions(draft.repetitions),
    examDate: draft.examDate,
    reminderTime: draft.reminderTime,
    remindersEnabled,
  };
}
