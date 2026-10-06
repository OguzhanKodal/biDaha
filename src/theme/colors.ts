// Uygulamadaki tüm renkler burada tanımlanır; ekranlar renkleri useTheme() üzerinden alır.

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSelected: string;
  border: string;
  text: string;
  textSecondary: string;
  /** Dolgu rengi (ana buton, ilerleme çubuğu). Üzerine onPrimary yazılır. */
  primary: string;
  onPrimary: string;
  /** Vurgu rengi yazı/ikon için (başlık butonları, seçim). Zemin üzerinde okunur kontrastta. */
  accent: string;
  /** "Çözdüm" / tamamlanan sorular */
  success: string;
  successSoft: string;
  /** "Çözemedim" / aktif sorular */
  danger: string;
  dangerSoft: string;
  /** Fotoğraf düzenleme/görüntüleme zemini ve üzerindeki yazı/çizgiler */
  media: string;
  onMedia: string;
  /** Kırpma çerçevesi dışını karartan katman */
  scrim: string;
};

// Sıcak, mat pastel palet: krem zemin, hardal sarısı vurgu, adaçayı yeşili ve kiremit kırmızısı.
export const colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#FBF8F1',
    surface: '#F3EEE2',
    surfaceSelected: '#E9E2D2',
    border: '#D9CFBC',
    text: '#2B2721',
    textSecondary: '#6B6357',
    primary: '#E8C468',
    onPrimary: '#2B2721',
    accent: '#7A5D0C',
    success: '#3D6A42',
    successSoft: '#E1ECDD',
    danger: '#96432F',
    dangerSoft: '#F5E1DB',
    media: '#000000',
    onMedia: '#FFFFFF',
    scrim: 'rgba(0, 0, 0, 0.55)',
  },
  dark: {
    background: '#1C1A17',
    surface: '#27241F',
    surfaceSelected: '#332F29',
    border: '#443F37',
    text: '#F2EDE3',
    textSecondary: '#B3AA9B',
    primary: '#E3C06A',
    onPrimary: '#231F18',
    accent: '#E8C877',
    success: '#8DB98F',
    successSoft: '#25312A',
    danger: '#E08D7F',
    dangerSoft: '#3A2622',
    media: '#000000',
    onMedia: '#FFFFFF',
    scrim: 'rgba(0, 0, 0, 0.55)',
  },
};

/**
 * Klasör renkleri. Veritabanında anahtar (ör. "blue") tutulur,
 * gösterilecek ton açık/koyu moda göre buradan seçilir.
 */
export const folderPalette = {
  blue: { light: '#7FA7C9', dark: '#94B8D6' },
  teal: { light: '#7DB8B0', dark: '#8FC7BF' },
  green: { light: '#93B88A', dark: '#A5C79C' },
  yellow: { light: '#E3C46A', dark: '#E8CD80' },
  orange: { light: '#E2A574', dark: '#E8B386' },
  red: { light: '#D98880', dark: '#E29A92' },
  pink: { light: '#D9A0B8', dark: '#E2B0C5' },
  purple: { light: '#A99AC9', dark: '#B8AAD6' },
  gray: { light: '#A8A39A', dark: '#B5B0A6' },
} as const satisfies Record<string, Record<ColorScheme, string>>;

export type FolderColor = keyof typeof folderPalette;

export const folderColors = Object.keys(folderPalette) as FolderColor[];

export const defaultFolderColor: FolderColor = 'blue';

export function isFolderColor(value: string): value is FolderColor {
  return value in folderPalette;
}
