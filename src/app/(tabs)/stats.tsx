import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { ScreenScrollView } from '@/components/ScreenScrollView';

export default function StatsScreen() {
  return (
    <ScreenScrollView>
      <AppText variant="largeTitle" accessibilityRole="header">
        İstatistik
      </AppText>
      <EmptyState
        icon="chart.bar"
        title="Yakında"
        message="Ders bazında ilerlemeni ve en sık yaptığın hata türlerini burada göreceksin."
      />
    </ScreenScrollView>
  );
}
