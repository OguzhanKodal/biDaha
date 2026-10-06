import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { AppText } from '@/components/AppText';
import { HeaderButton } from '@/components/HeaderButton';
import { updateSettings } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { useSettings } from '@/features/settings/SettingsProvider';
import { TimePicker } from '@/features/settings/TimePicker';
import { syncReminders } from '@/lib/reminders';
import { useTheme } from '@/theme';

export default function ReminderTimeSettingScreen() {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { settings, reloadSettings } = useSettings();
  const [time, setTime] = useState(settings.notification_time);

  const save = async () => {
    await updateSettings(db, { notification_time: time });
    await reloadSettings();
    await syncReminders(db);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderButton label="Vazgeç" onPress={() => router.back()} />,
          headerRight: () => <HeaderButton label="Kaydet" bold onPress={save} />,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <TimePicker value={time} onChange={setTime} />
        <AppText color="textSecondary" style={{ textAlign: 'center' }}>
          Her gün saat {time} olduğunda o günkü tekrar sayını bildiririz.
        </AppText>
      </ScrollView>
    </>
  );
}
