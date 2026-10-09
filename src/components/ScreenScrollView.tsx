import { Platform, ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/**
 * Sekmelerin doğrudan ekranları için kaydırılabilir kök görünüm.
 * Stack içinde olmayan ekranlar arka planı kendisi vermeli (koyu mod için).
 * iOS üst/alt güvenli alanı contentInsetAdjustmentBehavior ile kendisi ayarlar; Android'de
 * (kenardan kenara çizim) durum çubuğu boşluğu elle eklenir.
 */
export function ScreenScrollView({ style, contentContainerStyle, ...rest }: ScrollViewProps) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTop = Platform.OS === 'android' ? insets.top : 0;
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      {...rest}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      contentContainerStyle={[
        { padding: spacing.xl, paddingTop: spacing.xl + androidTop, gap: spacing.lg },
        contentContainerStyle,
      ]}
    />
  );
}
