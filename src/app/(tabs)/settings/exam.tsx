import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { AppText } from '@/components/AppText';
import { createFolder, listFolderTree } from '@/db/folders';
import { updateSettings } from '@/db/settings';
import { useDatabase } from '@/db/useDatabase';
import { examLabels, missingSubjects, type ExamType } from '@/domain/examPresets';
import { autoFolderColor } from '@/domain/folders';
import { ExamOptions } from '@/features/settings/ExamOptions';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTheme } from '@/theme';

/**
 * Sınav değiştirme (SPEC §3): mevcut klasörler silinmez; yeni sınavın eksik dersleri önerilir.
 * Ayrı ekran: Android'de uyarı penceresi en fazla 3 buton gösterebildiği için 4 seçenek oraya sığmaz.
 */
export default function ExamSettingScreen() {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { settings, reloadSettings } = useSettings();
  const [busy, setBusy] = useState(false);

  const choose = async (exam: ExamType) => {
    if (busy) return;
    if (exam === settings.exam_type) {
      router.back();
      return;
    }
    setBusy(true);
    try {
      await updateSettings(db, { exam_type: exam });
      await reloadSettings();
      const existing = (await listFolderTree(db)).filter((f) => f.parent_id === null);
      const missing = missingSubjects(
        exam,
        existing.map((f) => f.name),
      );
      if (missing.length === 0) {
        router.back();
        return;
      }
      Alert.alert(
        `${examLabels[exam]} dersleri eklensin mi?`,
        `Eksik ${missing.length} ders: ${missing.join(', ')}. Mevcut klasörlerin silinmez.`,
        [
          { text: 'Hayır', style: 'cancel', onPress: () => router.back() },
          {
            text: 'Ekle',
            onPress: async () => {
              const now = new Date().toISOString();
              for (const [i, name] of missing.entries()) {
                await createFolder(db, { name, color: autoFolderColor(existing.length + i), parentId: null }, now);
              }
              router.back();
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <AppText color="textSecondary">
        Sınavı değiştirince mevcut klasörlerin ve soruların silinmez; yeni sınavın eksik dersleri eklenmesi önerilir.
      </AppText>
      <ExamOptions value={settings.exam_type} onChange={choose} />
    </ScrollView>
  );
}
