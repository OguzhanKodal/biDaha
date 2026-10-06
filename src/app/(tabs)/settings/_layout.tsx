import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/theme/navigation';

export default function SettingsLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Ayarlar', headerLargeTitle: true }} />
      <Stack.Screen name="name" options={{ presentation: 'modal', title: 'İsim' }} />
      <Stack.Screen name="exam-date" options={{ presentation: 'modal', title: 'Sınav tarihi' }} />
      <Stack.Screen name="reminder-time" options={{ presentation: 'modal', title: 'Hatırlatma saati' }} />
    </Stack>
  );
}
