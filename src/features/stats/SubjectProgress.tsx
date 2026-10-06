import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import type { FolderWithStats } from '@/db/folders';
import { completionPercent } from '@/domain/folders';
import { minTouchSize, useTheme } from '@/theme';

/** Ders bazında soru sayısı ve tamamlanma oranı (konular dahil). Çubuklar tek renk; ders rengi sadece noktada. */
export function SubjectProgress({ subjects }: { subjects: FolderWithStats[] }) {
  const { colors, spacing, radius, folderColor } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {subjects.map((s) => {
        const pct = completionPercent(s.total, s.completed);
        return (
          <Pressable
            key={s.id}
            onPress={() => router.navigate({ pathname: '/folders/[id]', params: { id: String(s.id) } })}
            accessibilityRole="button"
            accessibilityLabel={`${s.name}: ${s.total} soru, yüzde ${pct} tamamlandı`}
            style={({ pressed }) => ({
              minHeight: minTouchSize,
              gap: spacing.xs,
              paddingVertical: spacing.xs,
              opacity: pressed ? 0.6 : 1,
            })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: folderColor(s.color) }} />
              <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                {s.name}
              </AppText>
              <AppText variant="callout" color="textSecondary">
                {s.total} soru · %{pct}
              </AppText>
              <Icon name="chevron.right" size={12} color="textSecondary" />
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.chartTrack, overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: 8, borderRadius: 4, backgroundColor: colors.chart }} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
