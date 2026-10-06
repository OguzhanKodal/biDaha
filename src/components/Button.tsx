import { Pressable, StyleSheet } from 'react-native';

import { minTouchSize, useTheme } from '@/theme';

import { AppText } from './AppText';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'plain' | 'destructive';
  disabled?: boolean;
  accessibilityHint?: string;
};

export function Button({ title, onPress, variant = 'primary', disabled = false, accessibilityHint }: Props) {
  const { colors, radius, spacing } = useTheme();

  const background = {
    primary: colors.primary,
    secondary: colors.surface,
    plain: 'transparent',
    destructive: colors.dangerSoft,
  }[variant];
  const textColor = ({ primary: 'onPrimary', secondary: 'text', plain: 'accent', destructive: 'danger' } as const)[
    variant
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}>
      <AppText variant="bodyStrong" color={textColor}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(minTouchSize, 50),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
