import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { examLabels } from '@/domain/examPresets';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingDraftProvider';
import { ExamDatePicker } from '@/features/settings/ExamDatePicker';
import { addDays, today } from '@/lib/date';

export default function ExamDateStep() {
  const { draft, update } = useOnboardingDraft();
  const todayValue = today();
  const selected = draft.examDate ?? addDays(todayValue, 180);
  const examName = draft.exam && draft.exam !== 'OTHER' ? examLabels[draft.exam] : 'Sınav';

  return (
    <OnboardingStep
      step={4}
      title="Sınav tarihin belli mi?"
      subtitle="Girersen ana ekranda geri sayım görürsün. İstersen bu adımı atlayabilirsin."
      primaryLabel="Devam"
      onPrimary={() => {
        update({ examDate: selected });
        router.push('/reminder');
      }}
      secondaryLabel="Tarih olmadan devam et"
      onSecondary={() => {
        update({ examDate: null });
        router.push('/reminder');
      }}>
      <AppText variant="bodyStrong">{examName} tarihi</AppText>
      <ExamDatePicker value={selected} minDate={todayValue} onChange={(examDate) => update({ examDate })} />
    </OnboardingStep>
  );
}
