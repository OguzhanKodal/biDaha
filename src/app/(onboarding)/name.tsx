import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TextField } from '@/components/TextField';
import { maxUserNameLength, validateUserName } from '@/domain/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingDraftProvider';
import { useTheme } from '@/theme';

export default function NameStep() {
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();
  const [touched, setTouched] = useState(false);
  const error = validateUserName(draft.name);

  const next = () => {
    setTouched(true);
    if (error === null) router.push('/exam');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingStep
        step={1}
        title="biDaha'ya hoş geldin"
        subtitle="Çözemediğin soruları kaydet, doğru zamanda tekrar et. Önce sana nasıl hitap edelim?"
        primaryLabel="Devam"
        onPrimary={next}
        primaryDisabled={draft.name.trim().length === 0}>
        <TextField
          label="Adın"
          placeholder="Ör. Ayşe"
          value={draft.name}
          onChangeText={(name) => update({ name })}
          maxLength={maxUserNameLength}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="givenName"
          autoComplete="name-given"
          returnKeyType="next"
          onSubmitEditing={next}
          autoFocus
          error={touched && error === 'empty' ? 'Lütfen adını yaz.' : null}
        />
        <AppText variant="caption" color="textSecondary">
          Adın sadece selamlama için kullanılır ve telefonundan çıkmaz.
        </AppText>
      </OnboardingStep>
    </SafeAreaView>
  );
}
