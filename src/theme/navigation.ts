import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import { useTheme } from './index';

/**
 * Navigasyon teması: başlık çubukları, modallar ve geçişler uygulama renklerini kullanır
 * (verilmezse açık temaya düşer ve koyu modda başlıklar beyaz kalır).
 */
export function useNavigationTheme(): Theme {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
}

/** Başlık çubuklu Stack'ler için ortak görünüm. */
export function useStackScreenOptions() {
  const { colors } = useTheme();
  return {
    headerBackTitle: 'Geri',
    // Android'de başlık varsayılan olarak sola yaslı; Vazgeç/Kaydet butonlarıyla sıkışmasın diye ortada.
    headerTitleAlign: 'center',
    headerTintColor: colors.accent,
    headerTitleStyle: { color: colors.text },
    headerLargeTitleStyle: { color: colors.text },
    contentStyle: { backgroundColor: colors.background },
  } as const;
}
