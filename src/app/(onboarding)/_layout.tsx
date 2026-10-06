import { Stack } from 'expo-router';

import { OnboardingDraftProvider } from '@/features/onboarding/OnboardingDraftProvider';
import { useStackScreenOptions } from '@/theme/navigation';

export const unstable_settings = {
  initialRouteName: 'name',
};

export default function OnboardingLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ ...screenOptions, title: '', headerShadowVisible: false }}>
        <Stack.Screen name="name" options={{ headerShown: false }} />
        <Stack.Screen name="exam" />
        <Stack.Screen name="repetitions" />
        <Stack.Screen name="exam-date" />
        <Stack.Screen name="reminder" />
      </Stack>
    </OnboardingDraftProvider>
  );
}
