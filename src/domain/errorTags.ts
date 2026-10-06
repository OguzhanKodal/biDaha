import { validateName, type NameError } from './names';

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

export type TagNameError = NameError;

/** Yeni etiket adını doğrular; geçerliyse null döner. */
export function validateTagName(name: string, existingNames: readonly string[]): TagNameError | null {
  return validateName(name, maxTagNameLength, existingNames);
}
