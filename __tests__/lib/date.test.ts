import { addDays, daysBetween, formatLongDate, isLocalDate, toLocalDate, today } from '@/lib/date';

describe('toLocalDate / today', () => {
  it('yerel günü YYYY-MM-DD olarak verir', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(today(new Date(2026, 9, 6, 0, 1))).toBe('2026-10-06');
  });
});

describe('isLocalDate', () => {
  it('geçerli tarihleri kabul eder', () => {
    expect(isLocalDate('2026-10-06')).toBe(true);
    expect(isLocalDate('2028-02-29')).toBe(true);
  });

  it('geçersiz tarihleri reddeder', () => {
    expect(isLocalDate('2026-02-30')).toBe(false);
    expect(isLocalDate('2026-13-01')).toBe(false);
    expect(isLocalDate('2026-1-5')).toBe(false);
    expect(isLocalDate('2026-10-06T00:00')).toBe(false);
  });
});

describe('addDays', () => {
  it('ay ve yıl sınırlarını geçer', () => {
    expect(addDays('2026-10-06', 1)).toBe('2026-10-07');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-10-06', 60)).toBe('2026-12-05');
    expect(addDays('2026-10-06', -6)).toBe('2026-09-30');
  });

  it('yaz saati geçişinde günü kaydırmaz', () => {
    // Avrupa/ABD yaz saati geçiş tarihleri; hangi saat diliminde çalışırsa çalışsın 1 gün eklenmeli.
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
  });

  it('geçersiz tarihte hata verir', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow();
  });
});

describe('daysBetween', () => {
  it('gün farkını verir', () => {
    expect(daysBetween('2026-10-06', '2026-10-07')).toBe(1);
    expect(daysBetween('2026-10-06', '2026-10-06')).toBe(0);
    expect(daysBetween('2026-10-07', '2026-10-06')).toBe(-1);
    expect(daysBetween('2026-10-06', '2027-06-20')).toBe(257);
  });
});

describe('formatLongDate', () => {
  it('Türkçe ay adıyla yazar', () => {
    expect(formatLongDate('2027-06-20')).toBe('20 Haziran 2027');
    expect(formatLongDate('2026-01-05')).toBe('5 Ocak 2026');
  });
});
