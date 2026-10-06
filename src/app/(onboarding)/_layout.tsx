import { Stack } from 'expo-router';

import { OnboardingDraftProvider } from '@/features/onboarding/OnboardingDraftProvider';
import { useTheme } from '@/theme';

export const unstable_settings = {
  initialRouteName: 'name',
};

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <OnboardingDraftProvider>
      <Stack
        screenOptions={{
          title: '',
          headerBackTitle: 'Geri',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerLargeTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="name" options={{ headerShown: false }} />
        <Stack.Screen name="exam" />
        <Stack.Screen name="repetitions" />
        <Stack.Screen name="exam-date" />
      </Stack>
    </OnboardingDraftProvider>
  );
}
