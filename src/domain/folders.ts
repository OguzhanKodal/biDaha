import { folderColors, type FolderColor } from '@/theme/colors';

import { examSubjects, type ExamType } from './examPresets';
import { validateName, type NameError } from './names';

export const maxFolderNameLength = 40;

/** Hazır derslere ve yeni klasörlere sırayla verilen renkler (gri hariç). */
const autoColors = folderColors.filter((c) => c !== 'gray');

export function autoFolderColor(index: number): FolderColor {
  return autoColors[index % autoColors.length];
}

export type NewFolder = {
  name: string;
  color: FolderColor;
  sortOrder: number;
};

/** Onboarding'de seçilen sınavın hazır dersleri. */
export function presetFolders(exam: ExamType): NewFolder[] {
  return examSubjects[exam].map((name, index) => ({
    name,
    color: autoFolderColor(index),
    sortOrder: index,
  }));
}

/** Aynı seviyedeki (aynı ders altındaki ya da en üstteki) klasör adlarıyla çakışmamalı. */
export function validateFolderName(name: string, siblingNames: readonly string[]): NameError | null {
  return validateName(name, maxFolderNameLength, siblingNames);
}

export const folderNameErrorMessages: Record<NameError, string> = {
  empty: 'Ad boş olamaz.',
  tooLong: `Ad en fazla ${maxFolderNameLength} karakter olabilir.`,
  duplicate: 'Bu adda bir klasör zaten var.',
};

/** Tamamlanma yüzdesi (0–100, tam sayı). Soru yoksa 0. */
export function completionPercent(total: number, completed: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(completed, total) / total) * 100);
}

/** Sıralamada bir öğeyi bir adım yukarı (-1) ya da aşağı (+1) taşır. Sınırdaysa aynı listeyi döner. */
export function moveItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return [...items];
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export type FolderStats = {
  total: number;
  due: number;
  completed: number;
};

/** Klasör kartındaki alt satır: "12 soru · 3 bugün · %40". */
export function folderSummary({ total, due, completed }: FolderStats): string {
  if (total === 0) return 'Henüz soru yok';
  const parts = [`${total} soru`];
  if (due > 0) parts.push(`${due} bugün`);
  parts.push(`%${completionPercent(total, completed)} tamamlandı`);
  return parts.join(' · ');
}
