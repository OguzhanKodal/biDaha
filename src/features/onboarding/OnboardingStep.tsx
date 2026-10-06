import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme';

export const onboardingStepCount = 5;

type Props = {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function OnboardingStep({
  step,
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
}: Props) {
  const { colors, spacing, radius } = useTheme();

  return (
    <SafeAreaView edges={['bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}
          contentInsetAdjustmentBehavior="automatic">
          <View
            style={[styles.row, { gap: spacing.xs }]}
            accessible
            accessibilityLabel={`Adım ${step} / ${onboardingStepCount}`}>
            {Array.from({ length: onboardingStepCount }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: radius.full,
                  backgroundColor: i < step ? colors.primary : colors.surfaceSelected,
                }}
              />
            ))}
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="title" accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? <AppText color="textSecondary">{subtitle}</AppText> : null}
          </View>
          {children}
        </ScrollView>
        <View style={{ padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm }}>
          <Button title={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} />
          {secondaryLabel && onSecondary ? (
            <Button title={secondaryLabel} onPress={onSecondary} variant="plain" />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
});
