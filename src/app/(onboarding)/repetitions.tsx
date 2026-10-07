import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { clampRepetitions, defaultRepetitions, maxRepetitions, minRepetitions } from '@/domain/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingDraftProvider';
import { displayMaxFontScale, minTouchSize, useTheme } from '@/theme';

export default function RepetitionsStep() {
  const { colors, spacing, radius } = useTheme();
  const { draft, update } = useOnboardingDraft();
  const value = draft.repetitions;
  const set = (n: number) => update({ repetitions: clampRepetitions(n) });

  const stepButton = (direction: -1 | 1) => {
    const disabled = direction < 0 ? value <= minRepetitions : value >= maxRepetitions;
    return (
      <Pressable
        onPress={() => set(value + direction)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={direction < 0 ? 'Azalt' : 'Artır'}
        accessibilityState={{ disabled }}
        style={({ pressed }) => ({
          width: minTouchSize + 12,
          height: minTouchSize + 12,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        })}>
        <Icon name={direction < 0 ? 'minus' : 'plus'} size={24} color="accent" />
      </Pressable>
    );
  };

  return (
    <OnboardingStep
      step={3}
      title="Bir soru kaç kez tekrar edilsin?"
      subtitle={`Bir soruyu farklı günlerde bu kadar kez çözünce "tamamlandı" sayılır. Aralıklar giderek uzar: 1, 3, 7, 14, 30 gün…`}
      primaryLabel="Devam"
      onPrimary={() => router.push('/exam-date')}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxl }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Tekrar sayısı"
        accessibilityValue={{ min: minRepetitions, max: maxRepetitions, now: value, text: `${value} kez` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}>
        {stepButton(-1)}
        <AppText
          style={{ fontSize: 64, fontWeight: '700', minWidth: 80, textAlign: 'center' }}
          maxFontSizeMultiplier={displayMaxFontScale}>
          {value}
        </AppText>
        {stepButton(1)}
      </View>
      <AppText color="textSecondary" style={{ textAlign: 'center' }}>
        {value === defaultRepetitions ? 'Önerilen değer' : `Önerilen: ${defaultRepetitions}`} · {minRepetitions}–
        {maxRepetitions} arası
      </AppText>
    </OnboardingStep>
  );
}
