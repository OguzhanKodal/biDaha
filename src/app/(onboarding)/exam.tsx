import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { examLabels, examSubjects, examTypes, type ExamType } from '@/domain/examPresets';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingDraftProvider';
import { minTouchSize, useTheme } from '@/theme';

function subjectHint(exam: ExamType): string {
  const count = examSubjects[exam].length;
  return count === 0 ? 'Boş başlar, derslerini kendin eklersin' : `${count} hazır ders ile başlar`;
}

export default function ExamStep() {
  const { colors, spacing, radius } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStep
      step={2}
      title="Hangi sınava hazırlanıyorsun?"
      subtitle="Seçimine göre ders klasörlerin hazır gelir. Sonradan değiştirebilirsin."
      primaryLabel="Devam"
      onPrimary={() => router.push('/repetitions')}
      primaryDisabled={draft.exam === null}>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {examTypes.map((exam) => {
          const selected = draft.exam === exam;
          return (
            <Pressable
              key={exam}
              onPress={() => update({ exam })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${examLabels[exam]}, ${subjectHint(exam)}`}
              style={({ pressed }) => ({
                minHeight: minTouchSize + 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: selected ? colors.accent : colors.surface,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.7 : 1,
              })}>
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <AppText variant="bodyStrong">{examLabels[exam]}</AppText>
                <AppText variant="callout" color="textSecondary">
                  {subjectHint(exam)}
                </AppText>
              </View>
              <Icon
                name={selected ? 'checkmark.circle.fill' : 'circle'}
                size={24}
                color={selected ? 'accent' : 'border'}
              />
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}
