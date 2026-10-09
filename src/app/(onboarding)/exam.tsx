import { router } from 'expo-router';

import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingDraftProvider';
import { ExamOptions } from '@/features/settings/ExamOptions';

export default function ExamStep() {
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStep
      step={2}
      title="Hangi sınava hazırlanıyorsun?"
      subtitle="Seçimine göre ders klasörlerin hazır gelir. Sonradan değiştirebilirsin."
      primaryLabel="Devam"
      onPrimary={() => router.push('/repetitions')}
      primaryDisabled={draft.exam === null}>
      <ExamOptions value={draft.exam} onChange={(exam) => update({ exam })} />
    </OnboardingStep>
  );
}
