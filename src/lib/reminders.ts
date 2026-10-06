import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

import type { Database } from '@/db/database';
import { getSettings, listDueGroups } from '@/db/settings';
import { buildReminderPlan, dueCountsForDays, reminderPlanDays } from '@/domain/reminders';

import { today } from './date';

/** Uygulama açıkken gelen bildirim de banner olarak görünsün. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** İzin ister; reddedildiyse kullanıcıyı Ayarlar'a yönlendirmeyi önerir. İzin varsa true. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    if (requested.granted) return true;
  }
  Alert.alert(
    'Bildirim izni kapalı',
    'Hatırlatma gönderebilmemiz için telefonunun Ayarlar’ından biDaha bildirimlerini açman gerekiyor.',
    [
      { text: 'Şimdi değil', style: 'cancel' },
      { text: 'Ayarlar’ı aç', onPress: () => Linking.openSettings() },
    ],
  );
  return false;
}

let syncing: Promise<void> | null = null;
let pending = false;

/**
 * Bildirim planını baştan kurar: önceki tüm planlı bildirimleri iptal eder, ayar açıksa ve izin
 * varsa önümüzdeki günlerin bildirimlerini o anki soru sayılarıyla yeniden zamanlar.
 * Aynı anda tek senkron çalışır; arada gelen istek bir kez daha çalıştırılır.
 */
export function syncReminders(db: Database): Promise<void> {
  if (syncing) {
    pending = true;
    return syncing;
  }
  syncing = (async () => {
    try {
      do {
        pending = false;
        await runSync(db);
      } while (pending);
    } catch (e) {
      console.warn('Bildirim planı kurulamadı', e);
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

async function runSync(db: Database): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const settings = await getSettings(db);
  if (settings.onboarding_done !== 1 || settings.notifications_enabled !== 1) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const todayValue = today();
  const counts = dueCountsForDays(await listDueGroups(db), todayValue, reminderPlanDays);
  const plan = buildReminderPlan(todayValue, new Date(), settings.notification_time, counts);
  for (const reminder of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: reminder.title, body: reminder.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date },
    });
  }
}
