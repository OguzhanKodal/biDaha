/** İstatistik hesapları (SPEC §9). Saf fonksiyonlar. */
import { addDays, type LocalDate } from '@/lib/date';

/** Yüzde (0–100, tam sayı). Payda 0 ise 0. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export type DailyReviewRow = { review_date: LocalDate; total: number; solved: number };
export type DailyPoint = { date: LocalDate; total: number; solved: number; failed: number };

/** Son N günü (bugün dahil, eskiden yeniye) boşluksuz doldurur; tekrar olmayan gün 0. */
export function fillDailySeries(rows: readonly DailyReviewRow[], today: LocalDate, days = 30): DailyPoint[] {
  const byDate = new Map(rows.map((r) => [r.review_date, r]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - (days - 1));
    const row = byDate.get(date);
    const total = row?.total ?? 0;
    const solved = row?.solved ?? 0;
    return { date, total, solved, failed: total - solved };
  });
}

export function summarizeSeries(points: readonly DailyPoint[]) {
  const total = points.reduce((n, p) => n + p.total, 0);
  const solved = points.reduce((n, p) => n + p.solved, 0);
  return { total, solved, solvedPercent: percent(solved, total), activeDays: points.filter((p) => p.total > 0).length };
}

export type TagCount = { id: number; name: string; count: number };
export type TagShare = TagCount & { percent: number };

/**
 * Hata nedeni dağılımı, SORULARA göre: "Matematik sorularının %45'inde dikkatsizlik var".
 * Bir soruda birden fazla neden olabildiği için toplam %100'ü geçebilir.
 * Hiç işaretlenmemiş nedenler listelenmez; en sık önce, eşitlikte ada göre.
 */
export function tagShares(tags: readonly TagCount[], questionCount: number): TagShare[] {
  return tags
    .filter((t) => t.count > 0)
    .map((t) => ({ ...t, percent: percent(t.count, questionCount) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));
}

/**
 * En sık neden için özet: "Matematik sorularında en sık neden: Dikkatsizlik (%45)".
 * Yüzdeye ek getirilmez; Türkçe ek sayının okunuşuna göre değişir (%45'inde, %10'unda).
 */
export function topTagSentence(scopeName: string | null, top: TagShare | undefined): string | null {
  if (!top) return null;
  const scope = scopeName ? `${scopeName} sorularında` : 'Tüm sorularda';
  return `${scope} en sık neden: ${top.name} (%${top.percent})`;
}
