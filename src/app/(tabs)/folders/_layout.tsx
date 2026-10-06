import { Stack } from 'expo-router';

import { useStackScreenOptions } from '@/theme/navigation';

export default function FoldersLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Klasörler', headerLargeTitle: true }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
      <Stack.Screen name="edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="move" options={{ presentation: 'modal', title: 'Soruları taşı' }} />
    </Stack>
  );
}
