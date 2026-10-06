import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Button } from '@/components/Button';
import { HeaderButton } from '@/components/HeaderButton';
import { updateSettings } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { isValidExamDate } from '@/domain/onboarding';
import { ExamDatePicker } from '@/features/settings/ExamDatePicker';
import { useSettings } from '@/features/settings/SettingsProvider';
import { addDays, today } from '@/lib/date';
import { useTheme } from '@/theme';

export default function ExamDateSettingScreen() {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { settings, reloadSettings } = useSettings();
  const todayValue = today();
  const initial = settings.exam_date && isValidExamDate(settings.exam_date, todayValue) ? settings.exam_date : addDays(todayValue, 180);
  const [date, setDate] = useState(initial);

  const save = async (examDate: string | null) => {
    await updateSettings(db, { exam_date: examDate });
    await reloadSettings();
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderButton label="Vazgeç" onPress={() => router.back()} />,
          headerRight: () => <HeaderButton label="Kaydet" bold onPress={() => save(date)} />,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <ExamDatePicker value={date} minDate={todayValue} onChange={setDate} />
        {settings.exam_date ? (
          <Button title="Tarihi kaldır" variant="destructive" onPress={() => save(null)} />
        ) : null}
      </ScrollView>
    </>
  );
}
