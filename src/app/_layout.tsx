import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DATABASE_NAME, initDatabase } from '@/db/client';
import { SettingsProvider, useSettings } from '@/features/settings/SettingsProvider';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbError, setDbError] = useState<Error | null>(null);

  if (dbError) {
    return <DatabaseErrorScreen error={dbError} />;
  }

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase} onError={setDbError}>
      <SettingsProvider onError={setDbError}>
        <RootStack />
      </SettingsProvider>
    </SQLiteProvider>
  );
}

/** Onboarding bitmediyse sadece onboarding, bittiyse sadece sekmeler erişilebilir. */
function RootStack() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const onboardingDone = settings.onboarding_done === 1;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={onboardingDone}>
          <Stack.Screen name="(tabs)" />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
});
