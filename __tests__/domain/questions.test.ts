import {
  filterSourceSuggestions,
  initialSchedule,
  isDue,
  nextReviewLabel,
  optionalText,
  progressLabel,
  validateQuestionDraft,
} from '@/domain/questions';

describe('initialSchedule', () => {
  it('yeni soruyu yarına planlar', () => {
    expect(initialSchedule('2026-12-31')).toEqual({ success_count: 0, next_review_date: '2027-01-01' });
  });
});

describe('progressLabel', () => {
  it('başarı / hedef gösterir, hedefi aşmaz', () => {
    expect(progressLabel(2, 5)).toBe('2/5');
    expect(progressLabel(7, 5)).toBe('5/5');
  });
});

describe('nextReviewLabel', () => {
  const today = '2026-10-06';
  it('gün farkına göre metin verir', () => {
    expect(nextReviewLabel('2026-10-06', today)).toBe('Bugün');
    expect(nextReviewLabel('2026-10-07', today)).toBe('Yarın');
    expect(nextReviewLabel('2026-10-13', today)).toBe('7 gün sonra');
  });

  it('günü geçmiş soru da Bugün listesindedir', () => {
    expect(nextReviewLabel('2026-10-01', today)).toBe('Bugün');
    expect(isDue('2026-10-01', today)).toBe(true);
    expect(isDue('2026-10-07', today)).toBe(false);
  });
});

describe('optionalText', () => {
  it('boş metni null yapar, kırpar', () => {
    expect(optionalText('  ')).toBeNull();
    expect(optionalText(undefined)).toBeNull();
    expect(optionalText(' 3D Yayınları ')).toBe('3D Yayınları');
  });
});

describe('filterSourceSuggestions', () => {
  const recent = ['3D TYT Matematik', 'Bilgi Sarmal', 'Limit Yayınları', 'Deneme 4'];

  it('boş girdide son kaynakları verir', () => {
    expect(filterSourceSuggestions(recent, '', 2)).toEqual(['3D TYT Matematik', 'Bilgi Sarmal']);
  });

  it('içeren kaynakları büyük/küçük harf gözetmeden süzer', () => {
    expect(filterSourceSuggestions(recent, 'lİMİT')).toEqual(['Limit Yayınları']);
    expect(filterSourceSuggestions(recent, 'mat')).toEqual(['3D TYT Matematik']);
  });

  it('birebir yazılanı önermez', () => {
    expect(filterSourceSuggestions(recent, 'Bilgi Sarmal')).toEqual([]);
  });
});

describe('validateQuestionDraft', () => {
  it('fotoğraf ve klasör zorunludur', () => {
    expect(validateQuestionDraft({ hasQuestionPhoto: false, folderId: null })).toEqual(['missingPhoto', 'missingFolder']);
    expect(validateQuestionDraft({ hasQuestionPhoto: true, folderId: 3 })).toEqual([]);
  });
});
