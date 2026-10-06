import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { DailyPoint } from '@/domain/stats';
import { formatDayMonth } from '@/lib/date';
import { useTheme } from '@/theme';

const CHART_HEIGHT = 120;
const GAP = 2;

function describe(point: DailyPoint): string {
  if (point.total === 0) return `${formatDayMonth(point.date)} · tekrar yok`;
  return `${formatDayMonth(point.date)} · ${point.total} tekrar · ${point.solved} çözdüm · ${point.failed} çözemedim`;
}

/**
 * Son 30 günün tekrar sayıları: tek seri, tek renk sütunlar (lejant gerekmez, başlık adlandırır).
 * Sütuna dokununca o günün ayrıntısı üstte yazar; dokunma alanı sütunun tüm yüksekliğidir.
 */
export function DailyChart({ points }: { points: DailyPoint[] }) {
  const { colors, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(points.length - 1);
  const max = Math.max(1, ...points.map((p) => p.total));
  const barWidth = width > 0 ? (width - GAP * (points.length - 1)) / points.length : 0;
  const current = points[Math.min(selected, points.length - 1)];

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="callout" accessibilityLiveRegion="polite" numberOfLines={1}>
        {current ? describe(current) : ''}
      </AppText>
      <View>
        <AppText variant="caption" color="textSecondary">
          {max}
        </AppText>
        <View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={{
            height: CHART_HEIGHT,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: GAP,
            borderBottomWidth: 1,
            borderBottomColor: colors.chartTrack,
          }}>
          {barWidth > 0
            ? points.map((point, index) => {
                const isSelected = index === selected;
                const height = point.total === 0 ? 0 : Math.max(4, (point.total / max) * CHART_HEIGHT);
                return (
                  <Pressable
                    key={point.date}
                    onPress={() => setSelected(index)}
                    accessibilityRole="button"
                    accessibilityLabel={describe(point)}
                    accessibilityState={{ selected: isSelected }}
                    hitSlop={{ top: 8, bottom: 8 }}
                    style={{
                      width: barWidth,
                      height: CHART_HEIGHT,
                      justifyContent: 'flex-end',
                      borderRadius: 4,
                      backgroundColor: isSelected ? colors.chartTrack : 'transparent',
                    }}>
                    <View
                      style={{
                        height,
                        backgroundColor: colors.chart,
                        borderTopLeftRadius: Math.min(4, barWidth / 2),
                        borderTopRightRadius: Math.min(4, barWidth / 2),
                      }}
                    />
                  </Pressable>
                );
              })
            : null}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
          <AppText variant="caption" color="textSecondary">
            {points[0] ? formatDayMonth(points[0].date) : ''}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Bugün
          </AppText>
        </View>
      </View>
    </View>
  );
}
