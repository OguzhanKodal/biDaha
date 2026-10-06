import type { SFSymbol } from 'expo-symbols';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type Tone = 'danger' | 'success' | 'neutral';

/** Durum rozeti. Anlam renkle birlikte ikon/metinle de verilir (erişilebilirlik). */
export function Badge({ text, tone = 'neutral', icon }: { text: string; tone?: Tone; icon?: SFSymbol }) {
  const { colors, spacing, radius } = useTheme();
  const palette = {
    danger: { bg: colors.dangerSoft, fg: 'danger' as const },
    success: { bg: colors.successSoft, fg: 'success' as const },
    neutral: { bg: colors.surfaceSelected, fg: 'textSecondary' as const },
  }[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs + 1,
        alignSelf: 'flex-start',
        backgroundColor: palette.bg,
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
      }}>
      {icon ? <Icon name={icon} size={11} color={palette.fg} /> : null}
      <AppText variant="caption" color={palette.fg} style={{ fontWeight: '600' }}>
        {text}
      </AppText>
    </View>
  );
}
