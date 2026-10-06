import { Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { devResetAllData } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { useSettings } from '@/features/settings/SettingsProvider';
import { deleteAllPhotoFiles } from '@/lib/photos';
import { useTheme } from '@/theme';

export default function SettingsScreen() {
  const { spacing } = useTheme();
  const db = useDatabase();
  const { reloadSettings } = useSettings();

  const confirmDevReset = () => {
    Alert.alert('Tüm veriler silinsin mi?', 'Geliştirme aracı: sorular, fotoğraflar, klasörler ve ayarlar silinir; onboarding baştan başlar.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: async () => {
          await devResetAllData(db);
          deleteAllPhotoFiles();
          await reloadSettings();
        },
      },
    ]);
  };

  return (
    <ScreenScrollView>
      <AppText variant="largeTitle" accessibilityRole="header">
        Ayarlar
      </AppText>
      <EmptyState icon="gearshape" title="Yakında" message="İsim, sınav, tekrar sayısı, bildirim ve yedekleme ayarları burada olacak." />
      {__DEV__ ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" color="textSecondary">
            Sadece geliştirme sürümünde görünür.
          </AppText>
          <Button title="Verileri sıfırla, onboarding'e dön" variant="destructive" onPress={confirmDevReset} />
        </View>
      ) : null}
    </ScreenScrollView>
  );
}
