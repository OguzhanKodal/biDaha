import { SymbolView, type SFSymbol } from 'expo-symbols';

import { useTheme, type ThemeColors } from '@/theme';

type Props = {
  name: SFSymbol;
  size?: number;
  color?: keyof ThemeColors;
  /** Tema dışı özel ton (ör. klasör rengi). */
  tint?: string;
};

/** SF Symbols ikonu; erişilebilirlik için dekoratif kabul edilir, anlamı yanındaki metin taşır. */
export function Icon({ name, size = 20, color = 'text', tint }: Props) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={tint ?? colors[color]}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
