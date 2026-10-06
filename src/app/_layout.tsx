import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DATABASE_NAME, initDatabase } from '@/db/client';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbError, setDbError] = useState<Error | null>(null);

  if (dbError) {
    return <DatabaseErrorScreen error={dbError} />;
  }

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase} onError={setDbError}>
      <AppStack />
    </SQLiteProvider>
  );
}

function AppStack() {
  const { colors } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

/** Veritabanı açılamazsa veya migration başarısız olursa: veriye dokunmadan bilgi ver. */
function DatabaseErrorScreen({ error }: { error: Error }) {
  const { colors, spacing, typography } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={[styles.center, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <Text style={[typography.heading, { color: colors.text, marginBottom: spacing.sm }]}>
        Veriler açılamadı
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
        Verilerin silinmedi. Uygulamayı kapatıp yeniden açmayı dene.
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg }]}>
        {error.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
