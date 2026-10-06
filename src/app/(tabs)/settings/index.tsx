import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { createFolder, listFolderTree } from '@/db/folders';
import { changeTargetRepetitions, countCompletedByTarget, devMakeAllDue, resetAllData, updateSettings } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { examLabels, examTypes, missingSubjects, type ExamType } from '@/domain/examPresets';
import { autoFolderColor } from '@/domain/folders';
import { clampRepetitions, maxRepetitions, minRepetitions } from '@/domain/onboarding';
import { SettingsRow, SettingsSection, SettingsStepper, SettingsSwitch } from '@/features/settings/SettingsList';
import { useSettings } from '@/features/settings/SettingsProvider';
import { formatLongDate, today } from '@/lib/date';
import { deleteAllPhotoFiles } from '@/lib/photos';
import { ensureNotificationPermission, syncReminders } from '@/lib/reminders';
import { useTheme } from '@/theme';

/** Ayarlar (SPEC §12). */
export default function SettingsScreen() {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { settings, reloadSettings } = useSettings();
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (e) {
      Alert.alert('Bir sorun oluştu', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  // Sınav değişince mevcut klasörler silinmez; yeni sınavın eksik dersleri önerilir (SPEC §3).
  const applyExam = (exam: ExamType) =>
    run(async () => {
      await updateSettings(db, { exam_type: exam });
      await reloadSettings();
      const existing = (await listFolderTree(db)).filter((f) => f.parent_id === null);
      const missing = missingSubjects(
        exam,
        existing.map((f) => f.name),
      );
      if (missing.length === 0) return;
      Alert.alert(
        `${examLabels[exam]} dersleri eklensin mi?`,
        `Eksik ${missing.length} ders: ${missing.join(', ')}. Mevcut klasörlerin silinmez.`,
        [
          { text: 'Hayır', style: 'cancel' },
          {
            text: 'Ekle',
            onPress: () =>
              run(async () => {
                const now = new Date().toISOString();
                for (const [i, name] of missing.entries()) {
                  await createFolder(db, { name, color: autoFolderColor(existing.length + i), parentId: null }, now);
                }
              }),
          },
        ],
      );
    });

  const chooseExam = () =>
    Alert.alert('Hangi sınava hazırlanıyorsun?', undefined, [
      ...examTypes.map((exam) => ({
        text: exam === settings.exam_type ? `✓ ${examLabels[exam]}` : examLabels[exam],
        onPress: () => {
          if (exam !== settings.exam_type) applyExam(exam);
        },
      })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);

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
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
      <SettingsSection title="Profil">
        <SettingsRow icon="person" label="İsim" value={settings.name ?? ''} onPress={() => router.push('/settings/name')} />
        <SettingsRow
          icon="graduationcap"
          label="Sınav"
          value={settings.exam_type ? examLabels[settings.exam_type] : 'Seçilmedi'}
          onPress={chooseExam}
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
        <SettingsRow icon="square.and.arrow.up" label="Yedekle" value="Yakında" disabled />
        <SettingsRow icon="square.and.arrow.down" label="Yedekten geri yükle" value="Yakında" disabled />
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
  );
}
