/**
 * Günlük hatırlatma bildirimi (SPEC §10). Yerel bildirimin metni zamanlandığı anda sabitlenir;
 * bu yüzden önümüzdeki günler için ayrı ayrı bildirim kurulur ve uygulama açılıp kapandıkça,
 * tekrar ve soru değişikliklerinden sonra plan yeniden hesaplanır.
 *
 * Her gün seçilen saatte bir bildirim gider:
 * - o gün bekleyen soru varsa: "Bugün N soru seni bekliyor"
 * - yoksa (bittiyse ya da hiç yoksa): yeni soru eklemeyi hatırlatma
 */
import { addDays, daysBetween, parseLocalDate, type LocalDate } from '@/lib/date';

export const defaultReminderTime = '20:00';
export const reminderPlanDays = 14;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function parseTime(value: string): { hour: number; minute: number } {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new Error(`Geçersiz saat: ${value}`);
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export type DueGroup = { next_review_date: LocalDate; count: number };

/**
 * Her gün için o gün bekleyecek soru sayısı (o güne kadar tekrar günü gelmiş aktif sorular).
 * Bugünün sayısı gecikmiş soruları da içerir.
 */
export function dueCountsForDays(groups: readonly DueGroup[], today: LocalDate, days: number): number[] {
  return Array.from({ length: days }, (_, offset) => {
    const day = addDays(today, offset);
    return groups.reduce((sum, g) => (daysBetween(g.next_review_date, day) >= 0 ? sum + g.count : sum), 0);
  });
}

export function reminderBody(dueCount: number): string {
  return dueCount > 0
    ? `Bugün ${dueCount} soru seni bekliyor`
    : 'Bugün tekrar edilecek soru kalmadı. Çözemediğin bir soru varsa eklemeyi unutma.';
}

export type PlannedReminder = { date: Date; title: string; body: string };

/** Önümüzdeki günlerin bildirimleri. Bugünün saati geçtiyse bugün atlanır. */
export function buildReminderPlan(
  today: LocalDate,
  now: Date,
  time: string,
  dueCounts: readonly number[],
): PlannedReminder[] {
  const { hour, minute } = parseTime(time);
  return dueCounts.flatMap((count, offset) => {
    const date = parseLocalDate(addDays(today, offset));
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() <= now.getTime()) return [];
    return [{ date, title: 'biDaha', body: reminderBody(count) }];
  });
}
