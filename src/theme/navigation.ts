import { useTheme } from './index';

/** Başlık çubuklu Stack'ler için ortak görünüm. */
export function useStackScreenOptions() {
  const { colors } = useTheme();
  return {
    headerBackTitle: 'Geri',
    headerTintColor: colors.accent,
    headerTitleStyle: { color: colors.text },
    headerLargeTitleStyle: { color: colors.text },
    headerStyle: { backgroundColor: colors.background },
    contentStyle: { backgroundColor: colors.background },
  } as const;
}
