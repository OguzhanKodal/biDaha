/** Ad karşılaştırması: baştaki/sondaki boşluk ve büyük/küçük harf (Türkçe İ/ı dahil) yok sayılır. */
export function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase('tr-TR');
}

export type NameError = 'empty' | 'tooLong' | 'duplicate';

export function validateName(
  name: string,
  maxLength: number,
  existingNames: readonly string[] = [],
): NameError | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.length > maxLength) return 'tooLong';
  const normalized = normalizeName(trimmed);
  if (existingNames.some((n) => normalizeName(n) === normalized)) return 'duplicate';
  return null;
}
