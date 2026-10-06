import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useSettings } from '@/features/settings/SettingsProvider';

export default function TodayScreen() {
  const { settings } = useSettings();

  return (
    <ScreenScrollView>
      <AppText variant="largeTitle" accessibilityRole="header">
        Merhaba {settings.name}
      </AppText>
      <EmptyState
        icon="checkmark.seal"
        title="Bugün tekrar edilecek soru yok"
        message="Çözemediğin soruları ekledikçe tekrar zamanı gelenler burada görünecek."
        action={<Button title="Klasörlere git" variant="secondary" onPress={() => router.navigate('/folders')} />}
      />
    </ScreenScrollView>
  );
}
