import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { Alert } from 'react-native';

import { AppText } from '@/components/AppText';
import { completeOnboarding } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { examLabels } from '@/domain/examPresets';
import { finalizeDraft } from '@/domain/onboarding';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingDraftProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { addDays, parseLocalDate, toLocalDate, today } from '@/lib/date';
import { useTheme } from '@/theme';

export default function ExamDateStep() {
  const db = useDatabase();
  const { colors, scheme } = useTheme();
  const { reloadSettings } = useSettings();
  const { draft, update } = useOnboardingDraft();
  const [saving, setSaving] = useState(false);

  const todayValue = today();
  const selected = draft.examDate ?? addDays(todayValue, 180);
  const examName = draft.exam && draft.exam !== 'OTHER' ? examLabels[draft.exam] : 'Sınav';

  const finish = async (examDate: string | null) => {
    const answers = finalizeDraft({ ...draft, examDate }, todayValue);
    if (!answers) {
      Alert.alert('Eksik bilgi', 'Lütfen önceki adımlara dönüp bilgileri tamamla.');
      return;
    }
    setSaving(true);
    try {
      await completeOnboarding(db, answers, new Date().toISOString());
      // Ayarlar yenilenince kök layout sekmelere geçer.
      await reloadSettings();
    } catch (e) {
      setSaving(false);
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <OnboardingStep
      step={4}
      title="Sınav tarihin belli mi?"
      subtitle="Girersen ana ekranda geri sayım görürsün. İstersen bu adımı atlayabilirsin."
      primaryLabel="Başla"
      onPrimary={() => finish(selected)}
      primaryDisabled={saving}
      secondaryLabel="Tarih olmadan başla"
      onSecondary={() => finish(null)}>
      <AppText variant="bodyStrong">{examName} tarihi</AppText>
      <Host matchContents={{ vertical: true }} colorScheme={scheme} style={{ alignSelf: 'stretch' }}>
        <DatePicker
          selection={parseLocalDate(selected)}
          range={{ start: parseLocalDate(todayValue) }}
          displayedComponents={['date']}
          onDateChange={(date) => update({ examDate: toLocalDate(date) })}
          modifiers={[datePickerStyle('graphical'), tint(colors.accent)]}
        />
      </Host>
    </OnboardingStep>
  );
}
