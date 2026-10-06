import { normalizeName } from './names';

export const examTypes = ['YKS', 'DGS', 'KPSS', 'OTHER'] as const;

export type ExamType = (typeof examTypes)[number];

export const examLabels: Record<ExamType, string> = {
  YKS: 'YKS',
  DGS: 'DGS',
  KPSS: 'KPSS',
  OTHER: 'Diğer',
};

/** Sınav seçimine göre hazır gelen dersler (SPEC §3). */
export const examSubjects: Record<ExamType, readonly string[]> = {
  YKS: [
    'TYT Türkçe',
    'TYT Matematik',
    'TYT Geometri',
    'TYT Fizik',
    'TYT Kimya',
    'TYT Biyoloji',
    'TYT Tarih',
    'TYT Coğrafya',
    'TYT Felsefe',
    'TYT Din Kültürü',
    'AYT Matematik',
    'AYT Geometri',
    'AYT Fizik',
    'AYT Kimya',
    'AYT Biyoloji',
    'AYT Edebiyat',
    'AYT Tarih',
    'AYT Coğrafya',
    'AYT Felsefe Grubu',
  ],
  DGS: ['Matematik', 'Geometri', 'Sayısal Mantık', 'Türkçe', 'Sözel Mantık'],
  KPSS: ['Türkçe', 'Matematik', 'Geometri', 'Tarih', 'Coğrafya', 'Vatandaşlık', 'Güncel Bilgiler'],
  OTHER: [],
};

export function isExamType(value: string): value is ExamType {
  return (examTypes as readonly string[]).includes(value);
}

/**
 * Sınav değiştiğinde önerilecek dersler: yeni sınavın hazır derslerinden
 * henüz klasör olarak bulunmayanlar (büyük/küçük harf ve boşluk farkı yok sayılır).
 */
export function missingSubjects(exam: ExamType, existingFolderNames: readonly string[]): string[] {
  const existing = new Set(existingFolderNames.map(normalizeName));
  return examSubjects[exam].filter((name) => !existing.has(normalizeName(name)));
}
