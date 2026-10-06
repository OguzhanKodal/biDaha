import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppText } from '@/components/AppText';
import { DATABASE_NAME, initDatabase } from '@/db/client';
import { SettingsProvider, useSettings } from '@/features/settings/SettingsProvider';
import { useTheme } from '@/theme';
import { useStackScreenOptions } from '@/theme/navigation';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbError, setDbError] = useState<Error | null>(null);

  return (
    <GestureHandlerRootView style={styles.flex}>
      {dbError ? (
        <DatabaseErrorScreen error={dbError} />
      ) : (
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase} onError={setDbError}>
          <SettingsProvider onError={setDbError}>
            <RootStack />
          </SettingsProvider>
        </SQLiteProvider>
      )}
    </GestureHandlerRootView>
  );
}

/** Onboarding bitmediyse sadece onboarding, bittiyse sekmeler ve soru ekranları erişilebilir. */
function RootStack() {
  const stackOptions = useStackScreenOptions();
  const { settings } = useSettings();
  const onboardingDone = settings.onboarding_done === 1;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ ...stackOptions, headerShown: false }}>
        <Stack.Protected guard={onboardingDone}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="question/new" options={{ presentation: 'fullScreenModal', headerShown: true }} />
          <Stack.Screen name="question/edit" options={{ presentation: 'fullScreenModal', headerShown: true }} />
          <Stack.Screen name="question/[id]" options={{ headerShown: true, title: 'Soru' }} />
          <Stack.Screen name="question/crop" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="question/photo" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen
            name="question/pick-folder"
            options={{ presentation: 'modal', headerShown: true, title: 'Klasör seç' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!onboardingDone}>
          <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

/** Veritabanı açılamazsa veya migration başarısız olursa: veriye dokunmadan bilgi ver. */
function DatabaseErrorScreen({ error }: { error: Error }) {
  const { colors, spacing } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.xl, gap: spacing.sm }]}>
      <AppText variant="heading">Veriler açılamadı</AppText>
      <AppText color="textSecondary" style={styles.centerText}>
        Verilerin silinmedi. Uygulamayı kapatıp yeniden açmayı dene.
      </AppText>
      <AppText variant="caption" color="textSecondary" style={[styles.centerText, { marginTop: spacing.lg }]}>
        {error.message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
});
