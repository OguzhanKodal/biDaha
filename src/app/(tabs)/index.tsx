import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { countQuestions } from '@/db/backup';
import { countDue, listReviewDays } from '@/db/reviews';
import { useDatabase } from '@/db/useDatabase';
import { daysSinceBackup, shouldRemindBackup } from '@/domain/backup';
import { examCountdownLabel, streakDays, streakLabel } from '@/domain/spacedRepetition';
import { useSettings } from '@/features/settings/SettingsProvider';
import { today } from '@/lib/date';
import { useFocusedData } from '@/lib/useFocusedData';
import { useTheme } from '@/theme';

/** Ana ekran (SPEC §8): selamlama, geri sayım, bugünkü tekrar, seri, hızlı soru ekleme. */
export default function TodayScreen() {
  const db = useDatabase();
  const { colors, spacing, radius } = useTheme();
  const { settings } = useSettings();
  const todayValue = today();

  const { data } = useFocusedData(async () => {
    const [due, days, questionCount] = await Promise.all([
      countDue(db, todayValue),
      listReviewDays(db),
      countQuestions(db),
    ]);
    return { due, questionCount, streak: streakDays(days, todayValue), reviewedToday: days[0] === todayValue };
  });

  const countdown = examCountdownLabel(settings.exam_type, settings.exam_date, todayValue);
  const streak = data ? streakLabel(data.streak, data.reviewedToday) : null;
  const due = data?.due ?? 0;
  const hasDue = due > 0;
  const remindBackup = data ? shouldRemindBackup(settings.last_backup_at, data.questionCount, todayValue) : false;
  const backupDays = daysSinceBackup(settings.last_backup_at, todayValue);

  return (
    <ScreenScrollView>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="largeTitle" accessibilityRole="header">
          Merhaba {settings.name}
        </AppText>
        {countdown ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name="calendar" size={16} color="accent" />
            <AppText variant="bodyStrong" color="accent">
              {countdown}
            </AppText>
          </View>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: hasDue ? colors.primary : colors.surface,
          borderRadius: radius.lg,
          padding: spacing.xl,
          gap: spacing.md,
        }}>
        <AppText variant="callout" color={hasDue ? 'onPrimary' : 'textSecondary'}>
          Bugün tekrar edilecek
        </AppText>
        <AppText style={{ fontSize: 44, lineHeight: 50, fontWeight: '700' }} color={hasDue ? 'onPrimary' : 'text'}>
          {data ? `${due} soru` : '…'}
        </AppText>
        {hasDue ? (
          // Sarı kart üzerinde krem buton: koyu yazı okunur kalır.
          <Button
            title="Tekrara başla"
            variant="secondary"
            onPress={() => router.push({ pathname: '/review', params: { mode: 'due' } })}
          />
        ) : data ? (
          <AppText color="textSecondary">
            Bugünlük bu kadar. Yeni soru ekleyebilir ya da bir klasörde serbest çalışabilirsin.
          </AppText>
        ) : null}
      </View>

      {streak ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.lg,
          }}>
          <Icon name="flame" size={22} color="accent" />
          <AppText style={{ flex: 1 }}>{streak}</AppText>
        </View>
      ) : null}

      <Button title="Soru ekle" variant={hasDue ? 'secondary' : 'primary'} onPress={() => router.push('/question/new')} />

      {remindBackup ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="externaldrive.badge.icloud" size={20} color="accent" />
            <AppText variant="bodyStrong" style={{ flex: 1 }}>
              {backupDays === null ? 'Henüz yedeğin yok' : `${backupDays} gündür yedek almadın`}
            </AppText>
          </View>
          <AppText variant="callout" color="textSecondary">
            Soruların sadece bu telefonda duruyor. Telefon değişirse ya da uygulama silinirse kaybolmasın diye arada bir yedek al.
          </AppText>
          <Button title="Yedek almaya git" variant="plain" onPress={() => router.navigate('/settings')} />
        </View>
      ) : null}
    </ScreenScrollView>
  );
}
