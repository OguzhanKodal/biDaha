// Uygulamadaki tüm renkler burada tanımlanır; ekranlar renkleri useTheme() üzerinden alır.

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSelected: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  /** "Çözdüm" / tamamlanan sorular */
  success: string;
  successSoft: string;
  /** "Çözemedim" / aktif sorular */
  danger: string;
  dangerSoft: string;
};

export const colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#FFFFFF',
    surface: '#F2F2F7',
    surfaceSelected: '#E5E5EA',
    border: '#D1D1D6',
    text: '#111114',
    textSecondary: '#5F6168',
    primary: '#3B5BDB',
    onPrimary: '#FFFFFF',
    success: '#1F8A4C',
    successSoft: '#DDF3E5',
    danger: '#C92A2A',
    dangerSoft: '#FBE1E1',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSelected: '#2C2C2E',
    border: '#3A3A3C',
    text: '#F5F5F7',
    textSecondary: '#A1A1AA',
    primary: '#7C93F2',
    onPrimary: '#0B1033',
    success: '#4CC77F',
    successSoft: '#123222',
    danger: '#FF6B6B',
    dangerSoft: '#3A1717',
  },
};

/**
 * Klasör renkleri. Veritabanında anahtar (ör. "blue") tutulur,
 * gösterilecek ton açık/koyu moda göre buradan seçilir.
 */
export const folderPalette = {
  blue: { light: '#3B5BDB', dark: '#7C93F2' },
  teal: { light: '#0C8599', dark: '#3BC9DB' },
  green: { light: '#2B8A3E', dark: '#69DB7C' },
  yellow: { light: '#E67700', dark: '#FFD43B' },
  orange: { light: '#D9480F', dark: '#FFA94D' },
  red: { light: '#C92A2A', dark: '#FF8787' },
  pink: { light: '#A61E4D', dark: '#F783AC' },
  purple: { light: '#6741D9', dark: '#B197FC' },
  gray: { light: '#495057', dark: '#ADB5BD' },
} as const satisfies Record<string, Record<ColorScheme, string>>;

export type FolderColor = keyof typeof folderPalette;

export const folderColors = Object.keys(folderPalette) as FolderColor[];

export const defaultFolderColor: FolderColor = 'blue';

export function isFolderColor(value: string): value is FolderColor {
  return value in folderPalette;
}
