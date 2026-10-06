import { Text, type TextProps } from 'react-native';

import { useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: keyof ThemeColors;
};

export function AppText({ variant = 'body', color = 'text', style, ...rest }: Props) {
  const { colors, typography } = useTheme();
  return <Text {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}
