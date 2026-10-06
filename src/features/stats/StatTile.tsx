import type { SFSymbol } from 'expo-symbols';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme';

/** Tek sayılık özet (grafik değil): büyük değer + açıklama. */
export function StatTile({ icon, value, label }: { icon: SFSymbol; value: string; label: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs }}>
      <Icon name={icon} size={18} color="accent" />
      <AppText style={{ fontSize: 28, lineHeight: 34, fontWeight: '700' }}>{value}</AppText>
      <AppText variant="callout" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}
