import {
  applyReview,
  examCountdownLabel,
  intervalAfterSuccess,
  isCountable,
  reactivatedState,
  sessionSummary,
  streakDays,
  streakLabel,
  type ReviewState,
} from '@/domain/spacedRepetition';
import { addDays } from '@/lib/date';

const today = '2026-10-06';
const now = '2026-10-06T18:00:00.000Z';

function state(overrides: Partial<ReviewState> = {}): ReviewState {
  return { success_count: 0, next_review_date: today, last_result: null, completed_at: null, ...overrides };
}

describe('intervalAfterSuccess', () => {
  it("SPEC aralıklarını izler: 1. başarıdan sonra 3, 2.'den sonra 7 gün…", () => {
    expect([1, 2, 3, 4, 5].map(intervalAfterSuccess)).toEqual([3, 7, 14, 30, 60]);
  });

  it('60 günden sonra ikiye katlanır, 120 günü geçmez', () => {
    expect([6, 7, 8, 9].map(intervalAfterSuccess)).toEqual([120, 120, 120, 120]);
  });
});

describe('isCountable', () => {
  it('günü gelmiş ya da geçmiş aktif soru sayılır', () => {
    expect(isCountable(state(), today)).toBe(true);
    expect(isCountable(state({ next_review_date: '2026-09-20' }), today)).toBe(true);
  });

  it('günü gelmemiş ya da tamamlanmış soru sayılmaz', () => {
    expect(isCountable(state({ next_review_date: '2026-10-07' }), today)).toBe(false);
    expect(isCountable(state({ completed_at: now }), today)).toBe(false);
  });
});

describe('applyReview — Çözdüm', () => {
  it('başarıyı artırır ve aralığa göre planlar', () => {
    const { next, counted, completedNow } = applyReview(state(), 'success', 5, today, now);
    expect(counted).toBe(true);
    expect(completedNow).toBe(false);
    expect(next).toEqual({ success_count: 1, next_review_date: '2026-10-09', last_result: 'success', completed_at: null });
  });

  it('2. başarıdan sonra 7 gün', () => {
    const { next } = applyReview(state({ success_count: 1 }), 'success', 5, today, now);
    expect(next.next_review_date).toBe(addDays(today, 7));
  });

  it('başarı N olunca tamamlanır', () => {
    const { next, completedNow } = applyReview(state({ success_count: 4 }), 'success', 5, today, now);
    expect(completedNow).toBe(true);
    expect(next).toMatchObject({ success_count: 5, completed_at: now, last_result: 'success' });
  });

  it('N=3 ile üç sayılan tekrarda biter', () => {
    let s = state();
    let day = today;
    for (let i = 0; i < 3; i++) {
      const outcome = applyReview(s, 'success', 3, day, now);
      expect(outcome.counted).toBe(true);
      s = outcome.next;
      day = s.next_review_date;
    }
    expect(s.completed_at).toBe(now);
  });
});

describe('applyReview — Çözemedim', () => {
  it('başarı değişmez, yarına planlanır, son sonuç başarısız', () => {
    const { next, counted } = applyReview(state({ success_count: 2, last_result: 'success' }), 'fail', 5, today, now);
    expect(counted).toBe(true);
    expect(next).toEqual({ success_count: 2, next_review_date: '2026-10-07', last_result: 'fail', completed_at: null });
  });

  it('gecikmiş soru da yarına planlanır (ceza yok)', () => {
    const { next } = applyReview(state({ next_review_date: '2026-09-01' }), 'fail', 5, today, now);
    expect(next.next_review_date).toBe('2026-10-07');
  });
});

describe('applyReview — serbest çalışma / erken tekrar', () => {
  it('günü gelmemiş soruda hiçbir şey değişmez', () => {
    const before = state({ success_count: 1, next_review_date: '2026-10-09' });
    const success = applyReview(before, 'success', 5, today, now);
    const fail = applyReview(before, 'fail', 5, today, now);
    expect(success).toEqual({ next: before, counted: false, completedNow: false });
    expect(fail).toEqual({ next: before, counted: false, completedNow: false });
  });

  it('aynı gün art arda tekrarla soru bitirilemez', () => {
    let s = state({ success_count: 1 });
    for (let i = 0; i < 5; i++) s = applyReview(s, 'success', 5, today, now).next;
    expect(s.success_count).toBe(2);
    expect(s.completed_at).toBeNull();
  });

  it('aynı gün çözemedim sonrası tekrar sayılmaz', () => {
    const afterFail = applyReview(state({ success_count: 2 }), 'fail', 5, today, now).next;
    expect(applyReview(afterFail, 'success', 5, today, now).counted).toBe(false);
  });

  it('tamamlanmış soru tekrar edilince değişmez', () => {
    const done = state({ success_count: 5, completed_at: now });
    expect(applyReview(done, 'fail', 5, today, now).next).toBe(done);
  });
});

describe('reactivatedState', () => {
  it('başarıyı sıfırlar ve yarına planlar', () => {
    expect(reactivatedState(today)).toEqual({
      success_count: 0,
      next_review_date: '2026-10-07',
      last_result: null,
      completed_at: null,
    });
  });
});

describe('streakDays', () => {
  it('bugünden geriye kesintisiz günleri sayar', () => {
    expect(streakDays(['2026-10-06', '2026-10-05', '2026-10-04', '2026-10-01'], today)).toBe(3);
  });

  it('bugün henüz tekrar yoksa dünden sayar', () => {
    expect(streakDays(['2026-10-05', '2026-10-04'], today)).toBe(2);
  });

  it('dün de yoksa seri sıfırdır', () => {
    expect(streakDays(['2026-10-04'], today)).toBe(0);
    expect(streakDays([], today)).toBe(0);
  });

  it('ay sınırını geçer', () => {
    expect(streakDays(['2026-10-01', '2026-09-30', '2026-09-29'], '2026-10-01')).toBe(3);
  });
});

describe('streakLabel', () => {
  it('duruma göre metin verir', () => {
    expect(streakLabel(0, false)).toBeNull();
    expect(streakLabel(6, true)).toBe('6 gündür üst üste tekrar yapıyorsun');
    expect(streakLabel(1, true)).toBe('Bugün tekrar yaptın, seri başladı');
    expect(streakLabel(3, false)).toBe('3 günlük serin var, bugün tekrar yaparak sürdür');
  });
});

describe('examCountdownLabel', () => {
  it('sınav adıyla gün sayısını verir', () => {
    expect(examCountdownLabel('YKS', '2027-06-20', today)).toBe("YKS'ye 257 gün");
    expect(examCountdownLabel('KPSS', '2026-10-07', today)).toBe("KPSS'ye 1 gün");
    expect(examCountdownLabel('OTHER', '2026-10-16', today)).toBe('Sınavına 10 gün');
  });

  it('sınav günü ve sonrası', () => {
    expect(examCountdownLabel('DGS', today, today)).toBe('DGS bugün, başarılar!');
    expect(examCountdownLabel('DGS', '2026-10-01', today)).toBeNull();
    expect(examCountdownLabel('DGS', null, today)).toBeNull();
  });
});

describe('sessionSummary', () => {
  it('oturum sonuçlarını sayar', () => {
    expect(
      sessionSummary([
        { result: 'success', counted: true, completedNow: true },
        { result: 'success', counted: false, completedNow: false },
        { result: 'fail', counted: true, completedNow: false },
      ]),
    ).toEqual({ total: 3, solved: 2, failed: 1, completed: 1, uncounted: 1 });
  });
});
