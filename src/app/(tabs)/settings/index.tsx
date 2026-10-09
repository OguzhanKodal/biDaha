import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';

import { markBackupDone } from '@/db/backup';
import { changeTargetRepetitions, countCompletedByTarget, devMakeAllDue, resetAllData, updateSettings } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { lastBackupLabel } from '@/domain/backup';
import { examLabels } from '@/domain/examPresets';
import { clampRepetitions, maxRepetitions, minRepetitions } from '@/domain/onboarding';
import { SettingsRow, SettingsSection, SettingsStepper, SettingsSwitch } from '@/features/settings/SettingsList';
import { useSettings } from '@/features/settings/SettingsProvider';
import {
  applyBackup,
  BackupError,
  createBackupFile,
  discardStagedBackup,
  pickBackupFile,
  readBackupFile,
  shareBackupFile,
  type StagedBackup,
} from '@/lib/backup';
import { formatLongDate, toLocalDate, today } from '@/lib/date';
import { deleteAllPhotoFiles } from '@/lib/photos';
import { ensureNotificationPermission, syncReminders } from '@/lib/reminders';
import { useTheme } from '@/theme';

/** Ayarlar (SPEC §12). */
export default function SettingsScreen() {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { settings, reloadSettings } = useSettings();
  const [busy, setBusy] = useState(false);
  /** Uzun işlemlerde ekranı kaplayan gösterge metni. */
  const [progress, setProgress] = useState<string | null>(null);

  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (e) {
      Alert.alert('Bir sorun oluştu', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const backup = async () => {
    const created: { uri: string | null } = { uri: null };
    await run(async () => {
      setProgress('Yedek hazırlanıyor…');
      created.uri = (await createBackupFile(db)).uri;
    });
    if (!created.uri) return;
    // Paylaşım menüsü meşgul kilidinin DIŞINDA açılır: menü bir sebeple dönmezse ekran kilitli kalmasın.
    // iOS dosyanın gerçekten kaydedilip kaydedilmediğini bildirmez; menü kapanınca yedek alınmış sayılır.
    try {
      await shareBackupFile(created.uri);
      await markBackupDone(db, new Date().toISOString());
      await reloadSettings();
    } catch (e) {
      Alert.alert('Yedek paylaşılamadı', e instanceof Error ? e.message : String(e));
    }
  };

  const applyStaged = (staged: StagedBackup) =>
    run(async () => {
      setProgress('Yedek geri yükleniyor…');
      await applyBackup(db, staged);
      await reloadSettings();
      await syncReminders(db);
      setProgress(null);
      Alert.alert('Yedek geri yüklendi', `${staged.manifest.counts.questions} soru ve ${staged.manifest.counts.folders} klasör yüklendi.`);
    });

  const restore = () =>
    run(async () => {
      const uri = await pickBackupFile();
      if (!uri) return;
      setProgress('Yedek okunuyor…');
      let staged: StagedBackup;
      try {
        staged = await readBackupFile(db, uri);
      } catch (e) {
        setProgress(null);
        Alert.alert('Yedek açılamadı', e instanceof BackupError ? e.message : 'Bu dosya bir biDaha yedeği değil ya da bozuk.');
        return;
      }
      setProgress(null);
      const { counts, createdAt } = staged.manifest;
      Alert.alert(
        'Yedek geri yüklensin mi?',
        `${formatLongDate(toLocalDate(new Date(createdAt)))} tarihli yedek: ${counts.questions} soru, ${counts.folders} klasör, ${counts.photos} fotoğraf.\n\nŞu anki tüm verilerin bu yedekle DEĞİŞTİRİLECEK.`,
        [
          { text: 'Vazgeç', style: 'cancel', onPress: () => discardStagedBackup(staged) },
          {
            text: 'Devam',
            style: 'destructive',
            onPress: () =>
              Alert.alert('Emin misin?', 'Şu anki soruların, klasörlerin ve tekrar geçmişin silinip yerine yedektekiler gelecek. Bu işlem geri alınamaz.', [
                { text: 'Vazgeç', style: 'cancel', onPress: () => discardStagedBackup(staged) },
                { text: 'Geri yükle', style: 'destructive', onPress: () => applyStaged(staged) },
              ]),
          },
        ],
      );
    });

  // N düşerse başarısı yeni N'e ulaşan sorular tamamlanır (önce onay); artarsa tamamlananlar kalır.
  const changeTarget = (value: number) =>
    run(async () => {
      const target = clampRepetitions(value);
      const affected = await countCompletedByTarget(db, target);
      const apply = () =>
        run(async () => {
          await changeTargetRepetitions(db, target, new Date().toISOString());
          await reloadSettings();
          await syncReminders(db);
        });
      if (affected === 0) {
        await changeTargetRepetitions(db, target, new Date().toISOString());
        await reloadSettings();
        return;
      }
      Alert.alert(
        `Tekrar sayısı ${target} olsun mu?`,
        `${affected} soru ${target} kez çözüldüğü için tamamlanmış sayılacak.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Uygula', onPress: apply },
        ],
      );
    });

  const toggleReminders = (enabled: boolean) =>
    run(async () => {
      const allowed = enabled ? await ensureNotificationPermission() : true;
      if (enabled && !allowed) return;
      await updateSettings(db, { notifications_enabled: enabled });
      await reloadSettings();
      await syncReminders(db);
    });

  const confirmResetAll = () =>
    Alert.alert(
      'Tüm veriler silinsin mi?',
      'Bütün soruların, fotoğrafların, klasörlerin ve tekrar geçmişin bu telefondan silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Emin misin?', 'Bu işlem geri alınamaz. Yedeğin yoksa verilerin kalıcı olarak kaybolur.', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Hepsini sil',
                style: 'destructive',
                onPress: () =>
                  run(async () => {
                    // Önce kayıtlar, sonra dosyalar (Kural 1); ardından onboarding'e dönülür.
                    await resetAllData(db);
                    deleteAllPhotoFiles();
                    await syncReminders(db);
                    await reloadSettings();
                  }),
              },
            ]),
        },
      ],
    );

  const version = Constants.expoConfig?.version ?? '';

  return (
    <View style={styles.flex}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        <SettingsSection title="Profil">
          <SettingsRow icon="person" label="İsim" value={settings.name ?? ''} onPress={() => router.push('/settings/name')} />
          <SettingsRow
            icon="graduationcap"
            label="Sınav"
            value={settings.exam_type ? examLabels[settings.exam_type] : 'Seçilmedi'}
            onPress={() => router.push('/settings/exam')}
          />
          <SettingsRow
            icon="calendar"
            label="Sınav tarihi"
            value={settings.exam_date ? formatLongDate(settings.exam_date) : 'Yok'}
            onPress={() => router.push('/settings/exam-date')}
            last
          />
        </SettingsSection>

        <SettingsSection
          title="Tekrar"
          footer="Bir soru bu kadar kez (farklı günlerde) çözülünce tamamlanır. Düşürürsen bu sayıya ulaşmış sorular tamamlanır; artırırsan tamamlananlar olduğu gibi kalır.">
          <SettingsRow
            icon="arrow.triangle.2.circlepath"
            label="Tekrar sayısı"
            accessory={
              <SettingsStepper
                label="Tekrar sayısı"
                value={settings.target_repetitions}
                min={minRepetitions}
                max={maxRepetitions}
                onChange={changeTarget}
              />
            }
            last
          />
        </SettingsSection>

        <SettingsSection
          title="Bildirim"
          footer="Her gün seçtiğin saatte o günkü tekrar sayını bildiririz. Tekrar edilecek soru kalmadıysa yeni soru eklemeyi hatırlatırız.">
          <SettingsRow
            icon="bell"
            label="Günlük hatırlatma"
            accessory={
              <SettingsSwitch
                label="Günlük hatırlatma"
                value={settings.notifications_enabled === 1}
                onChange={toggleReminders}
              />
            }
          />
          <SettingsRow
            icon="clock"
            label="Saat"
            value={settings.notification_time}
            onPress={() => router.push('/settings/reminder-time')}
            disabled={settings.notifications_enabled !== 1}
            last
          />
        </SettingsSection>

        <SettingsSection title="Veri" footer="Verilerin sadece bu telefonda tutulur. Yedek almazsan telefon değişince ya da uygulama silinince kaybolur.">
          <SettingsRow icon="folder" label="Klasörleri yönet" onPress={() => router.navigate('/folders')} />
          <SettingsRow icon="clock.arrow.circlepath" label="Son yedek" value={lastBackupLabel(settings.last_backup_at, today())} />
          <SettingsRow icon="square.and.arrow.up" label="Yedekle" onPress={backup} />
          <SettingsRow icon="square.and.arrow.down" label="Yedekten geri yükle" onPress={restore} />
          <SettingsRow icon="trash" label="Tüm verileri sil" onPress={confirmResetAll} destructive last />
        </SettingsSection>

        <SettingsSection
          title="Hakkında"
          footer="biDaha hesap istemez, internete veri göndermez. Soruların, fotoğrafların ve ilerlemen yalnızca bu telefonda saklanır.">
          <SettingsRow icon="info.circle" label="Sürüm" value={version} last />
        </SettingsSection>

        {__DEV__ ? (
          <SettingsSection title="Geliştirme" footer="Sadece geliştirme sürümünde görünür.">
            <SettingsRow
              icon="hammer"
              label="Tüm aktif soruları bugüne çek"
              onPress={() =>
                run(async () => {
                  const n = await devMakeAllDue(db, today());
                  await syncReminders(db);
                  Alert.alert('Hazır', `${n} soru bugün tekrar edilecek.`);
                })
              }
              last
            />
          </SettingsSection>
        ) : null}
      </ScrollView>
      <ProgressOverlay label={progress} />
    </View>
  );
}

/**
 * Yedekleme sırasında ekranı kaplayan, dokunmayı engelleyen gösterge.
 * Bilerek native Modal DEĞİL: Modal kapanırken açılmaya çalışan paylaşım menüsü / uyarı
 * iOS'ta sessizce açılmayabiliyor.
 */
function ProgressOverlay({ label }: { label: string | null }) {
  const { colors, spacing, radius } = useTheme();
  if (!label) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.scrim }]}>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
        <AppText accessibilityLiveRegion="polite">{label}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
