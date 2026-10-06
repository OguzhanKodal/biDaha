import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { listFolders } from '@/db/folders';
import { listReviewDays } from '@/db/reviews';
import { getTagStats, listDailyReviews } from '@/db/stats';
import { useDatabase } from '@/db/useDatabase';
import { streakDays } from '@/domain/spacedRepetition';
import { fillDailySeries, percent, summarizeSeries } from '@/domain/stats';
import { DailyChart } from '@/features/stats/DailyChart';
import { StatTile } from '@/features/stats/StatTile';
import { SubjectProgress } from '@/features/stats/SubjectProgress';
import { TagBreakdown } from '@/features/stats/TagBreakdown';
import { addDays, today } from '@/lib/date';
import { useFocusedData } from '@/lib/useFocusedData';
import { useTheme } from '@/theme';

const DAYS = 30;

/** İstatistik (SPEC §9): özet, son 30 gün, ders bazında ilerleme, hata nedeni dağılımı. */
export default function StatsScreen() {
  const db = useDatabase();
  const { spacing } = useTheme();
  const [scopeId, setScopeId] = useState<number | null>(null);
  const todayValue = today();

  const { data, reload } = useFocusedData(async () => {
    const [subjects, reviewDays, daily, tagStats] = await Promise.all([
      listFolders(db, null, todayValue),
      listReviewDays(db),
      listDailyReviews(db, addDays(todayValue, -(DAYS - 1))),
      getTagStats(db, scopeId),
    ]);
    return { subjects, reviewDays, series: fillDailySeries(daily, todayValue, DAYS), tagStats };
  });

  const changeScope = (id: number | null) => {
    setScopeId(id);
    reload();
  };

  const subjects = data?.subjects.filter((s) => s.total > 0) ?? [];
  const totalQuestions = subjects.reduce((n, s) => n + s.total, 0);
  const completed = subjects.reduce((n, s) => n + s.completed, 0);
  const last30 = data ? summarizeSeries(data.series) : null;
  const streak = data ? streakDays(data.reviewDays, todayValue) : 0;
  const isEmpty = data !== null && totalQuestions === 0 && last30?.total === 0;

  return (
    <ScreenScrollView>
      <AppText variant="largeTitle" accessibilityRole="header">
        İstatistik
      </AppText>

      {isEmpty ? (
        <EmptyState
          icon="chart.bar"
          title="Henüz istatistik yok"
          message="Soru ekleyip tekrar yaptıkça ilerlemen ve en sık yaptığın hata türleri burada görünecek."
        />
      ) : data && last30 ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <StatTile icon="flame" value={`${streak} gün`} label="Seri" />
            <StatTile icon="square.stack" value={String(totalQuestions)} label="Toplam soru" />
            <StatTile
              icon="checkmark.seal"
              value={`%${percent(completed, totalQuestions)}`}
              label={`Tamamlanan (${completed})`}
            />
            <StatTile icon="arrow.triangle.2.circlepath" value={String(last30.total)} label={`Son ${DAYS} günde tekrar`} />
          </View>

          <Section
            title={`Son ${DAYS} gün`}
            note={
              last30.total > 0
                ? `${last30.activeDays} gün tekrar yaptın · çözülme oranı %${last30.solvedPercent}`
                : 'Bu dönemde tekrar yok'
            }>
            {last30.total > 0 ? (
              <DailyChart points={data.series} />
            ) : (
              <AppText color="textSecondary">Tekrar yaptıkça günlük sayıların burada sütun grafik olarak görünecek.</AppText>
            )}
          </Section>

          {subjects.length > 0 ? (
            <Section title="Ders bazında" note="Konulardaki sorular dersin sayısına dahil.">
              <SubjectProgress subjects={subjects} />
            </Section>
          ) : null}

          <Section title="Hata nedenleri">
            <TagBreakdown stats={data.tagStats} subjects={subjects} scopeId={scopeId} onScopeChange={changeScope} />
          </Section>
        </>
      ) : null}
    </ScreenScrollView>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
      <View style={{ gap: spacing.xxs }}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {note ? (
          <AppText variant="callout" color="textSecondary">
            {note}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}
