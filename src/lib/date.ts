/**
 * Yerel gün yardımcıları. Günler `YYYY-MM-DD` metni olarak tutulur ve
 * kullanıcının cihazındaki saat dilimine göre hesaplanır (UTC değil).
 */

export type LocalDate = string;

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toLocalDate(date: Date): LocalDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today(now: Date = new Date()): LocalDate {
  return toLocalDate(now);
}

export function isLocalDate(value: string): value is LocalDate {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Öğle saatine sabitlenir; yaz saati geçişleri günü kaydırmaz. */
function parseLocalDate(value: LocalDate): Date {
  if (!isLocalDate(value)) throw new Error(`Geçersiz tarih: ${value}`);
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(value: LocalDate, days: number): LocalDate {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

/** `to - from` gün farkı (ör. yarın için 1, dün için -1). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const ms = parseLocalDate(to).getTime() - parseLocalDate(from).getTime();
  return Math.round(ms / 86_400_000);
}
