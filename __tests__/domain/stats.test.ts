import { fillDailySeries, percent, summarizeSeries, tagShares, topTagSentence } from '@/domain/stats';
import { formatDayMonth } from '@/lib/date';

describe('percent', () => {
  it('yuvarlar, payda 0 ise 0', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(9, 20)).toBe(45);
    expect(percent(5, 0)).toBe(0);
  });
});

describe('fillDailySeries', () => {
  it('son 30 günü boşluksuz, eskiden yeniye verir', () => {
    const series = fillDailySeries(
      [
        { review_date: '2026-10-06', total: 5, solved: 3 },
        { review_date: '2026-09-07', total: 2, solved: 2 },
        { review_date: '2026-09-01', total: 9, solved: 9 }, // aralık dışı
      ],
      '2026-10-06',
    );
    expect(series).toHaveLength(30);
    expect(series[0]).toEqual({ date: '2026-09-07', total: 2, solved: 2, failed: 0 });
    expect(series[29]).toEqual({ date: '2026-10-06', total: 5, solved: 3, failed: 2 });
    expect(series[15]).toEqual({ date: '2026-09-22', total: 0, solved: 0, failed: 0 });
  });

  it('özetler', () => {
    const series = fillDailySeries([{ review_date: '2026-10-06', total: 4, solved: 3 }], '2026-10-06', 7);
    expect(summarizeSeries(series)).toEqual({ total: 4, solved: 3, solvedPercent: 75, activeDays: 1 });
  });
});

describe('tagShares', () => {
  it('sorulara göre yüzde verir, sıfırları atar, en sık önce sıralar', () => {
    const shares = tagShares(
      [
        { id: 1, name: 'Dikkatsizlik', count: 9 },
        { id: 2, name: 'Bilgi eksikliği', count: 0 },
        { id: 3, name: 'İşlem hatası', count: 12 },
        { id: 4, name: 'Süre yetmedi', count: 9 },
      ],
      20,
    );
    expect(shares.map((s) => [s.name, s.percent])).toEqual([
      ['İşlem hatası', 60],
      ['Dikkatsizlik', 45],
      ['Süre yetmedi', 45],
    ]);
  });

  it('bir soruda birden fazla neden olabildiği için toplam %100ü geçebilir', () => {
    const total = tagShares(
      [
        { id: 1, name: 'A', count: 2 },
        { id: 2, name: 'B', count: 2 },
      ],
      2,
    ).reduce((n, s) => n + s.percent, 0);
    expect(total).toBe(200);
  });
});

describe('topTagSentence', () => {
  it('kapsama göre özet cümle kurar', () => {
    const top = { id: 1, name: 'Dikkatsizlik', count: 9, percent: 45 };
    expect(topTagSentence('Matematik', top)).toBe('Matematik sorularında en sık neden: Dikkatsizlik (%45)');
    expect(topTagSentence(null, top)).toBe('Tüm sorularda en sık neden: Dikkatsizlik (%45)');
    expect(topTagSentence(null, undefined)).toBeNull();
  });
});

describe('formatDayMonth', () => {
  it('gün ve ay adı', () => {
    expect(formatDayMonth('2026-10-06')).toBe('6 Ekim');
  });
});
