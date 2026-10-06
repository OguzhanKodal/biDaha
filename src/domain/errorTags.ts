/**
 * Hazır hata nedeni etiketleri (SPEC §4). Kullanıcı kendi etiketlerini de ekleyebilir.
 * Not: İlk migration bu listeyi içe aktarmaz, kendi kopyasını tutar; migration'lar değişmemeli.
 */
export const defaultErrorTags = [
  'Dikkatsizlik',
  'Bilgi eksikliği',
  'Süre yetmedi',
  'Soruyu yanlış okuma',
  'İşlem hatası',
  'Yorumlayamadım',
] as const;

export const maxTagNameLength = 40;

export type TagNameError = 'empty' | 'tooLong' | 'duplicate';

/** Yeni etiket adını doğrular; geçerliyse null döner. */
export function validateTagName(name: string, existingNames: readonly string[]): TagNameError | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'empty';
  if (trimmed.length > maxTagNameLength) return 'tooLong';
  const lower = trimmed.toLocaleLowerCase('tr-TR');
  if (existingNames.some((n) => n.trim().toLocaleLowerCase('tr-TR') === lower)) return 'duplicate';
  return null;
}
