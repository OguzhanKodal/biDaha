import {
  clampRepetitions,
  emptyDraft,
  finalizeDraft,
  isValidExamDate,
  maxUserNameLength,
  validateUserName,
} from '@/domain/onboarding';

describe('validateUserName', () => {
  it('geçerli ismi kabul eder', () => {
    expect(validateUserName('Ayşe')).toBeNull();
  });

  it('boş ve çok uzun ismi reddeder', () => {
    expect(validateUserName('   ')).toBe('empty');
    expect(validateUserName('a'.repeat(maxUserNameLength + 1))).toBe('tooLong');
  });
});

describe('clampRepetitions', () => {
  it('3–10 aralığında tutar', () => {
    expect(clampRepetitions(1)).toBe(3);
    expect(clampRepetitions(5)).toBe(5);
    expect(clampRepetitions(12)).toBe(10);
  });
});

describe('isValidExamDate', () => {
  it('bugün ve sonrasını kabul eder, geçmişi reddeder', () => {
    expect(isValidExamDate('2026-10-06', '2026-10-06')).toBe(true);
    expect(isValidExamDate('2027-06-20', '2026-10-06')).toBe(true);
    expect(isValidExamDate('2026-10-05', '2026-10-06')).toBe(false);
  });
});

describe('finalizeDraft', () => {
  const today = '2026-10-06';

  it('eksik taslağı kabul etmez', () => {
    expect(finalizeDraft(emptyDraft, today)).toBeNull();
    expect(finalizeDraft({ ...emptyDraft, name: 'Ayşe' }, today)).toBeNull();
  });

  it('ismi kırpar, sınav tarihi isteğe bağlıdır', () => {
    expect(finalizeDraft({ ...emptyDraft, name: '  Ayşe ', exam: 'YKS' }, today)).toEqual({
      name: 'Ayşe',
      exam: 'YKS',
      repetitions: 5,
      examDate: null,
    });
  });

  it('geçmiş sınav tarihini kabul etmez', () => {
    expect(finalizeDraft({ ...emptyDraft, name: 'Ayşe', exam: 'KPSS', examDate: '2026-01-01' }, today)).toBeNull();
  });
});
