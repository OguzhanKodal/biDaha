import { examSubjects, examTypes, isExamType, missingSubjects } from '@/domain/examPresets';

describe('examSubjects', () => {
  it('SPEC §3 ders sayılarıyla eşleşir', () => {
    expect(examSubjects.YKS).toHaveLength(19);
    expect(examSubjects.DGS).toHaveLength(5);
    expect(examSubjects.KPSS).toHaveLength(7);
    expect(examSubjects.OTHER).toHaveLength(0);
  });

  it('her sınavda ders adları tekildir', () => {
    for (const exam of examTypes) {
      expect(new Set(examSubjects[exam]).size).toBe(examSubjects[exam].length);
    }
  });
});

describe('isExamType', () => {
  it('geçerli sınav türlerini tanır', () => {
    expect(isExamType('YKS')).toBe(true);
    expect(isExamType('OTHER')).toBe(true);
    expect(isExamType('ALES')).toBe(false);
  });
});

describe('missingSubjects', () => {
  it('mevcut klasörleri atlayıp eksik dersleri önerir', () => {
    expect(missingSubjects('DGS', ['Matematik', 'Türkçe'])).toEqual(['Geometri', 'Sayısal Mantık', 'Sözel Mantık']);
  });

  it('büyük/küçük harf ve boşluk farkını yok sayar (Türkçe İ/ı dahil)', () => {
    expect(missingSubjects('KPSS', [' türkçe ', 'MATEMATİK', 'geometri', 'TARİH', 'coğrafya', 'VATANDAŞLIK', 'güncel bilgiler'])).toEqual([]);
  });

  it('Diğer için hiçbir şey önermez', () => {
    expect(missingSubjects('OTHER', [])).toEqual([]);
  });
});
