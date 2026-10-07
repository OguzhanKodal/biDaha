import type { TextStyle } from 'react-native';

/**
 * Yazı stilleri. lineHeight BİLEREK verilmez: sabit satır yüksekliği, kullanıcı telefonun yazı
 * boyutunu büyüttüğünde (Dynamic Type) büyümez ve harfleri keser. Satır yüksekliği yazıyla birlikte ölçeklenir.
 */
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700' },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  bodyStrong: { fontSize: 17, fontWeight: '600' },
  callout: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/**
 * Büyük yazı ayarında en fazla kaç kat büyüsün. Gövde metni çok büyüyebilir (erişilebilirlik);
 * zaten büyük olan başlıklar ve sayılar ekrana sığsın diye daha az büyür.
 */
export const maxFontScale: Record<TypographyVariant, number> = {
  largeTitle: 1.4,
  title: 1.5,
  heading: 1.8,
  body: 2.2,
  bodyStrong: 2.2,
  callout: 2.2,
  caption: 2.2,
};

/** Büyük gösterim sayıları (ör. "12 soru"): en fazla bu kadar büyür. */
export const displayMaxFontScale = 1.3;
