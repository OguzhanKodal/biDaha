import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function FoldersLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Geri',
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerLargeTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Klasörler', headerLargeTitle: true }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
      <Stack.Screen name="edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="move" options={{ presentation: 'modal', title: 'Soruları taşı' }} />
    </Stack>
  );
}
