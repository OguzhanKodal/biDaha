import { defaultErrorTags, maxTagNameLength, validateTagName } from '@/domain/errorTags';

describe('defaultErrorTags', () => {
  it('SPEC §4 deki 6 etiketi içerir', () => {
    expect(defaultErrorTags).toHaveLength(6);
  });
});

describe('validateTagName', () => {
  const existing = [...defaultErrorTags];

  it('geçerli adı kabul eder', () => {
    expect(validateTagName('Formülü unuttum', existing)).toBeNull();
  });

  it('boş adı reddeder', () => {
    expect(validateTagName('   ', existing)).toBe('empty');
  });

  it('çok uzun adı reddeder', () => {
    expect(validateTagName('a'.repeat(maxTagNameLength + 1), existing)).toBe('tooLong');
  });

  it('var olan adı büyük/küçük harf farkı gözetmeden reddeder', () => {
    expect(validateTagName(' dikkatsizlik ', existing)).toBe('duplicate');
    expect(validateTagName('İŞLEM HATASI', existing)).toBe('duplicate');
  });
});
