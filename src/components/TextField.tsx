import { TextInput, View, type TextInputProps } from 'react-native';

import { minTouchSize, useTheme } from '@/theme';

import { AppText } from './AppText';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, style, ...rest }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="callout" color="textSecondary">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        {...rest}
        style={[
          typography.body,
          {
            minHeight: minTouchSize + 6,
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            borderWidth: 1,
            borderColor: error ? colors.danger : 'transparent',
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
