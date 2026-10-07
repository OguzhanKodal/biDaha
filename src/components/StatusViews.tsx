import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/theme';

import { Button } from './Button';
import { EmptyState } from './EmptyState';

/** Ekran ortasında yükleniyor göstergesi. */
export function LoadingState() {
  const { colors } = useTheme();
  return (
    <View
      style={{ flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}
      accessible
      accessibilityLabel="Yükleniyor">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/** Veri okunamadığında: ne olduğunu söyler, verinin silinmediğini belirtir, tekrar denetir. */
export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="exclamationmark.triangle"
      title="Bir sorun oluştu"
      message={`Veriler okunamadı (${error.message}). Verilerin silinmedi.`}
      action={onRetry ? <Button title="Tekrar dene" variant="secondary" onPress={onRetry} /> : undefined}
    />
  );
}
