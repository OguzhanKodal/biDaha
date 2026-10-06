// Faz 0 geçici ekranı: kurulumun (tema + veritabanı) çalıştığını gösterir. Faz 1'de sekmelerle değişecek.
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listErrorTags } from '@/db/errorTags';
import { getSchemaVersion } from '@/db/migrate';
import { getSettings } from '@/db/settings';
import type { ErrorTagRow, SettingsRow } from '@/db/types';
import { examLabels } from '@/domain/examPresets';
import { today } from '@/lib/date';
import { folderColors, useTheme } from '@/theme';

type SetupInfo = {
  schemaVersion: number;
  settings: SettingsRow;
  tags: ErrorTagRow[];
};

export default function SetupCheckScreen() {
  const db = useSQLiteContext();
  const { colors, spacing, radius, typography, folderColor, scheme } = useTheme();
  const [info, setInfo] = useState<SetupInfo | null>(null);

  useEffect(() => {
    Promise.all([getSchemaVersion(db), getSettings(db), listErrorTags(db)]).then(
      ([schemaVersion, settings, tags]) => setInfo({ schemaVersion, settings, tags }),
    );
  }, [db]);

  const card = { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm };
  const label = [typography.callout, { color: colors.textSecondary }];
  const value = [typography.body, { color: colors.text }];

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text style={[typography.largeTitle, { color: colors.text }]}>biDaha</Text>
        <Text style={label}>Kurulum kontrolü · {scheme === 'dark' ? 'Koyu mod' : 'Açık mod'}</Text>

        <View style={card}>
          <Text style={[typography.heading, { color: colors.text }]}>Veritabanı</Text>
          {info ? (
            <>
              <Text style={value}>Şema sürümü: {info.schemaVersion}</Text>
              <Text style={value}>Tekrar sayısı: {info.settings.target_repetitions}</Text>
              <Text style={value}>
                Sınav: {info.settings.exam_type ? examLabels[info.settings.exam_type] : 'seçilmedi'}
              </Text>
              <Text style={value}>Bugün: {today()}</Text>
            </>
          ) : (
            <Text style={label}>Yükleniyor…</Text>
          )}
        </View>

        <View style={card}>
          <Text style={[typography.heading, { color: colors.text }]}>
            Hata nedeni etiketleri ({info?.tags.length ?? 0})
          </Text>
          {info?.tags.map((tag) => (
            <Text key={tag.id} style={value}>
              • {tag.name}
            </Text>
          ))}
        </View>

        <View style={card}>
          <Text style={[typography.heading, { color: colors.text }]}>Renkler</Text>
          <View style={styles.row}>
            <Badge text="Çözdüm" fg={colors.success} bg={colors.successSoft} />
            <Badge text="Çözemedim" fg={colors.danger} bg={colors.dangerSoft} />
          </View>
          <View style={[styles.row, { gap: spacing.sm }]}>
            {folderColors.map((key) => (
              <View
                key={key}
                accessibilityLabel={key}
                style={{ width: 28, height: 28, borderRadius: radius.full, backgroundColor: folderColor(key) }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ text, fg, bg }: { text: string; fg: string; bg: string }) {
  const { spacing, radius, typography } = useTheme();
  return (
    <Text
      style={[
        typography.callout,
        { color: fg, backgroundColor: bg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, overflow: 'hidden' },
      ]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
