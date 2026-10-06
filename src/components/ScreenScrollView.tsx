import { ScrollView, type ScrollViewProps } from 'react-native';

import { useTheme } from '@/theme';

/**
 * Sekmelerin doğrudan ekranları için kaydırılabilir kök görünüm.
 * Stack içinde olmayan ekranlar arka planı kendisi vermeli (koyu mod için).
 */
export function ScreenScrollView({ style, contentContainerStyle, ...rest }: ScrollViewProps) {
  const { colors, spacing } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      {...rest}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      contentContainerStyle={[{ padding: spacing.xl, gap: spacing.lg }, contentContainerStyle]}
    />
  );
}
