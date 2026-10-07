import { Text, type TextProps } from 'react-native';

import { maxFontScale, useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
};

export function AppText({ variant = 'body', color = 'text', style, ...rest }: Props) {
  const { colors, typography } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={maxFontScale[variant]}
      {...rest}
      style={[typography[variant], { color: colors[color] }, style]}
    />
  );
}
