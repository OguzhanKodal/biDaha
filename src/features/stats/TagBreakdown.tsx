import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import type { FolderWithStats } from '@/db/folders';
import type { TagStats } from '@/db/stats';
import { tagShares, topTagSentence } from '@/domain/stats';
import { useTheme } from '@/theme';

type Props = {
  stats: TagStats;
  subjects: FolderWithStats[];
  scopeId: number | null;
  onScopeChange: (id: number | null) => void;
};

/**
 * Hata nedeni dağılımı, sorulara göre (bir soruda birden fazla neden olabilir → toplam %100'ü geçebilir).
 * Kapsam filtresi grafiğin üstünde tek satır.
 */
export function TagBreakdown({ stats, subjects, scopeId, onScopeChange }: Props) {
  const { colors, spacing } = useTheme();
  const shares = tagShares(stats.tags, stats.questionCount);
  const scopeName = subjects.find((s) => s.id === scopeId)?.name ?? null;
  const summary = topTagSentence(scopeName, shares[0]);

  return (
    <View style={{ gap: spacing.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        <Chip label="Tümü" role="radio" selected={scopeId === null} onPress={() => onScopeChange(null)} />
        {subjects.map((s) => (
          <Chip key={s.id} label={s.name} role="radio" selected={scopeId === s.id} onPress={() => onScopeChange(s.id)} />
        ))}
      </ScrollView>

      {stats.questionCount === 0 ? (
        <AppText color="textSecondary">Bu kapsamda henüz soru yok.</AppText>
      ) : shares.length === 0 ? (
        <AppText color="textSecondary">Bu sorularda henüz hata nedeni seçilmemiş.</AppText>
      ) : (
        <>
          {summary ? <AppText variant="bodyStrong">{summary}</AppText> : null}
          {shares.map((share) => (
            <View
              key={share.id}
              accessible
              accessibilityLabel={`${share.name}: ${stats.questionCount} sorunun ${share.count} tanesinde, yüzde ${share.percent}`}
              style={{ gap: spacing.xxs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                <AppText style={{ flex: 1 }} numberOfLines={1}>
                  {share.name}
                </AppText>
                <AppText variant="callout" color="textSecondary">
                  %{share.percent} · {share.count} soru
                </AppText>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.chartTrack, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.min(100, share.percent)}%`,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.chart,
                  }}
                />
              </View>
            </View>
          ))}
        </>
      )}

      {stats.untagged > 0 ? (
        <AppText variant="caption" color="textSecondary">
          {stats.untagged} soruda neden seçilmemiş. Bir soruda birden fazla neden olabildiği için yüzdeler toplamı %100’ü geçebilir.
        </AppText>
      ) : stats.questionCount > 0 ? (
        <AppText variant="caption" color="textSecondary">
          Bir soruda birden fazla neden olabildiği için yüzdeler toplamı %100’ü geçebilir.
        </AppText>
      ) : null}
    </View>
  );
}
