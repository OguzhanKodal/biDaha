import type { SFSymbol } from 'expo-symbols';
import { Pressable } from 'react-native';

import { minTouchSize, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: SFSymbol;
  role?: 'checkbox' | 'radio' | 'button';
  accessibilityLabel?: string;
};

/** Seçilebilir etiket. Seçili durum renkle birlikte onay işaretiyle de gösterilir. */
export function Chip({ label, selected = false, onPress, icon, role = 'checkbox', accessibilityLabel }: Props) {
  const { colors, spacing, radius } = useTheme();
  const iconName = icon ?? (selected ? 'checkmark' : undefined);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === 'button' ? undefined : role === 'radio' ? { selected } : { checked: selected }}
      style={({ pressed }) => ({
        minHeight: minTouchSize - 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.primary : colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}>
      {iconName ? <Icon name={iconName} size={14} color={selected ? 'onPrimary' : 'accent'} /> : null}
      <AppText variant="callout" color={selected ? 'onPrimary' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}
