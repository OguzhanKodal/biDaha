import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { HeaderButton } from '@/components/HeaderButton';
import { TextField } from '@/components/TextField';
import { updateSettings } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { maxUserNameLength, validateUserName } from '@/domain/onboarding';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTheme } from '@/theme';

export default function NameSettingScreen() {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { settings, reloadSettings } = useSettings();
  const [name, setName] = useState(settings.name ?? '');
  const [submitted, setSubmitted] = useState(false);
  const error = validateUserName(name);

  const save = async () => {
    setSubmitted(true);
    if (error) return;
    await updateSettings(db, { name: name.trim() });
    await reloadSettings();
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
      <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
        <TextField
          label="Adın"
          value={name}
          onChangeText={setName}
          maxLength={maxUserNameLength}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
          error={submitted && error === 'empty' ? 'Lütfen adını yaz.' : null}
        />
      </ScrollView>
    </>
  );
}
