import { useState } from 'react';
import { Alert } from 'react-native';

import { AppText } from '@/components/AppText';
import { completeOnboarding } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { finalizeDraft } from '@/domain/onboarding';
import { reminderBody } from '@/domain/reminders';
import { OnboardingStep } from '@/features/onboarding/OnboardingStep';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingDraftProvider';
import { useSettings } from '@/features/settings/SettingsProvider';
import { TimePicker } from '@/features/settings/TimePicker';
import { today } from '@/lib/date';
import { ensureNotificationPermission, syncReminders } from '@/lib/reminders';

/** Son adım: günlük hatırlatma saati. İzin burada istenir; onboarding burada kaydedilir. */
export default function ReminderStep() {
  const db = useDatabase();
  const { reloadSettings } = useSettings();
  const { draft, update } = useOnboardingDraft();
  const [saving, setSaving] = useState(false);

  const finish = async (wantsReminders: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const enabled = wantsReminders ? await ensureNotificationPermission() : false;
      const answers = finalizeDraft(draft, today(), enabled);
      if (!answers) {
        setSaving(false);
        Alert.alert('Eksik bilgi', 'Lütfen önceki adımlara dönüp bilgileri tamamla.');
        return;
      }
      await completeOnboarding(db, answers, new Date().toISOString());
      await syncReminders(db);
      // Ayarlar yenilenince kök layout sekmelere geçer.
      await reloadSettings();
    } catch (e) {
      setSaving(false);
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <OnboardingStep
      step={5}
      title="Her gün hangi saatte hatırlatalım?"
      subtitle="Seçtiğin saatte o günkü tekrar sayını bildiririz. Soruların bittiyse yeni soru eklemeyi hatırlatırız. Saati sonra Ayarlar’dan değiştirebilirsin."
      primaryLabel="Hatırlatmayı aç ve başla"
      onPrimary={() => finish(true)}
      primaryDisabled={saving}
      secondaryLabel="Hatırlatma olmadan başla"
      onSecondary={() => finish(false)}>
      <TimePicker value={draft.reminderTime} onChange={(reminderTime) => update({ reminderTime })} />
      <AppText variant="callout" color="textSecondary" style={{ textAlign: 'center' }}>
        Örnek: “{reminderBody(8)}”
      </AppText>
    </OnboardingStep>
  );
}
