import {
  buildReminderPlan,
  dueCountsForDays,
  formatTime,
  isValidTime,
  parseTime,
  reminderBody,
} from '@/domain/reminders';

const today = '2026-10-06';

describe('saat yardımcıları', () => {
  it('HH:mm doğrular, ayrıştırır ve biçimler', () => {
    expect(isValidTime('20:00')).toBe(true);
    expect(isValidTime('07:05')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('7:05')).toBe(false);
    expect(parseTime('08:30')).toEqual({ hour: 8, minute: 30 });
    expect(formatTime(7, 5)).toBe('07:05');
    expect(() => parseTime('x')).toThrow();
  });
});

describe('dueCountsForDays', () => {
  it('her gün o güne kadar birikmiş soruları sayar', () => {
    const groups = [
      { next_review_date: '2026-10-01', count: 2 }, // gecikmiş
      { next_review_date: '2026-10-06', count: 1 },
      { next_review_date: '2026-10-08', count: 3 },
    ];
    expect(dueCountsForDays(groups, today, 4)).toEqual([3, 3, 6, 6]);
  });

  it('soru yoksa sıfırlar', () => {
    expect(dueCountsForDays([], today, 3)).toEqual([0, 0, 0]);
  });
});

describe('reminderBody', () => {
  it('bekleyen soru varsa sayıyı, yoksa ekleme hatırlatmasını verir', () => {
    expect(reminderBody(8)).toBe('Bugün 8 soru seni bekliyor');
    expect(reminderBody(0)).toContain('eklemeyi unutma');
  });
});

describe('buildReminderPlan', () => {
  it('her gün seçilen saatte bildirim kurar; soru olmayan gün de hatırlatma gider', () => {
    const now = new Date(2026, 9, 6, 9, 0);
    const plan = buildReminderPlan(today, now, '20:30', [2, 0, 5]);
    expect(plan).toHaveLength(3);
    expect(plan.map((p) => [p.date.getDate(), p.date.getHours(), p.date.getMinutes()])).toEqual([
      [6, 20, 30],
      [7, 20, 30],
      [8, 20, 30],
    ]);
    expect(plan[0].body).toBe('Bugün 2 soru seni bekliyor');
    expect(plan[1].body).toContain('eklemeyi unutma');
  });

  it('bugünün saati geçtiyse bugünü atlar', () => {
    const now = new Date(2026, 9, 6, 21, 0);
    const plan = buildReminderPlan(today, now, '20:00', [4, 1]);
    expect(plan).toHaveLength(1);
    expect(plan[0].date.getDate()).toBe(7);
  });
});
