import {
  autoFolderColor,
  completionPercent,
  folderSummary,
  maxFolderNameLength,
  moveItem,
  presetFolders,
  validateFolderName,
} from '@/domain/folders';
import { folderColors } from '@/theme/colors';

describe('presetFolders', () => {
  it('sınavın derslerini sırayla ve renkli oluşturur', () => {
    const folders = presetFolders('DGS');
    expect(folders.map((f) => f.name)).toEqual(['Matematik', 'Geometri', 'Sayısal Mantık', 'Türkçe', 'Sözel Mantık']);
    expect(folders.map((f) => f.sortOrder)).toEqual([0, 1, 2, 3, 4]);
    folders.forEach((f) => expect(folderColors).toContain(f.color));
  });

  it('Diğer için boş liste döner', () => {
    expect(presetFolders('OTHER')).toEqual([]);
  });

  it('YKS gibi uzun listelerde renkler döner, gri kullanılmaz', () => {
    const colors = presetFolders('YKS').map((f) => f.color);
    expect(colors).toHaveLength(19);
    expect(colors).not.toContain('gray');
    expect(autoFolderColor(0)).toBe(autoFolderColor(folderColors.length - 1));
  });
});

describe('validateFolderName', () => {
  it('geçerli adı kabul eder', () => {
    expect(validateFolderName('Türev', ['Limit'])).toBeNull();
  });

  it('boş, uzun ve tekrar eden adları reddeder', () => {
    expect(validateFolderName('  ', [])).toBe('empty');
    expect(validateFolderName('a'.repeat(maxFolderNameLength + 1), [])).toBe('tooLong');
    expect(validateFolderName('türev ', ['Türev'])).toBe('duplicate');
    expect(validateFolderName('İNTEGRAL', ['integral'])).toBe('duplicate');
  });
});

describe('completionPercent', () => {
  it('yüzdeyi yuvarlar, soru yoksa 0 verir', () => {
    expect(completionPercent(0, 0)).toBe(0);
    expect(completionPercent(3, 1)).toBe(33);
    expect(completionPercent(3, 2)).toBe(67);
    expect(completionPercent(4, 4)).toBe(100);
    expect(completionPercent(2, 5)).toBe(100);
  });
});

describe('moveItem', () => {
  const items = ['a', 'b', 'c'];

  it('öğeyi yukarı ve aşağı taşır', () => {
    expect(moveItem(items, 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(items, 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('sınırda değişiklik yapmaz ve orijinali bozmaz', () => {
    expect(moveItem(items, 0, -1)).toEqual(items);
    expect(moveItem(items, 2, 1)).toEqual(items);
    expect(items).toEqual(['a', 'b', 'c']);
  });
});

describe('folderSummary', () => {
  it('soru yoksa bunu söyler', () => {
    expect(folderSummary({ total: 0, due: 0, completed: 0 })).toBe('Henüz soru yok');
  });

  it('bugünkü tekrar sayısını sadece varsa gösterir', () => {
    expect(folderSummary({ total: 12, due: 3, completed: 5 })).toBe('12 soru · 3 bugün · %42 tamamlandı');
    expect(folderSummary({ total: 4, due: 0, completed: 4 })).toBe('4 soru · %100 tamamlandı');
  });
});
