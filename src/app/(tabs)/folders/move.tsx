import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HeaderButton } from '@/components/HeaderButton';
import { Icon } from '@/components/Icon';
import { getFolder, getFolderDeleteInfo, listMoveTargets, moveQuestionsAndDeleteFolder } from '@/db/folders';
import type { FolderRow } from '@/db/types';
import { useDatabase } from '@/db/useDatabase';
import { useFocusedData } from '@/lib/useFocusedData';
import { minTouchSize, useTheme } from '@/theme';

/** Silinecek klasörün sorularını başka klasöre taşıyıp klasörü siler. Parametre: id. */
export default function MoveQuestionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const folderId = Number(id);
  const db = useDatabase();
  const { colors, spacing, radius, folderColor } = useTheme();

  const { data } = useFocusedData(async () => {
    const [folder, info, targets] = await Promise.all([
      getFolder(db, folderId),
      getFolderDeleteInfo(db, folderId),
      listMoveTargets(db, folderId),
    ]);
    return { folder, info, targets };
  });

  const choose = (target: FolderRow) => {
    if (!data?.folder) return;
    const { folder, info } = data;
    const topicNote = info.topicCount > 0 ? ` ve ${info.topicCount} konusu` : '';
    Alert.alert(
      `${info.questionCount} soru "${target.name}" klasörüne taşınsın mı?`,
      `Ardından "${folder.name}"${topicNote} silinecek. Sorular ve tekrar geçmişleri korunur.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Taşı ve sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await moveQuestionsAndDeleteFolder(db, folder.id, target.id, new Date().toISOString());
              router.back();
            } catch (e) {
              Alert.alert('Taşınamadı', e instanceof Error ? e.message : String(e));
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerLeft: () => <HeaderButton label="Vazgeç" onPress={() => router.back()} /> }} />
      {data ? (
        <FlatList
          data={data.targets}
          keyExtractor={(f) => String(f.id)}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.xs }}
          ListHeaderComponent={
            data.folder ? (
              <AppText color="textSecondary" style={{ marginBottom: spacing.sm }}>
                “{data.folder.name}” içindeki {data.info.questionCount} soru nereye taşınsın?
              </AppText>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="folder.badge.questionmark"
              title="Taşınacak başka klasör yok"
              message="Önce yeni bir ders ya da konu ekle, sonra tekrar dene."
            />
          }
          renderItem={({ item }) => {
            const isTopic = item.parent_id !== null;
            return (
              <Pressable
                onPress={() => choose(item)}
                accessibilityRole="button"
                accessibilityLabel={isTopic ? `Konu: ${item.name}` : `Ders: ${item.name}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  minHeight: minTouchSize + 4,
                  paddingHorizontal: spacing.lg,
                  marginLeft: isTopic ? spacing.xl : 0,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.7 : 1,
                })}>
                {isTopic ? (
                  <Icon name="arrow.turn.down.right" size={14} color="textSecondary" />
                ) : (
                  <View
                    style={{ width: 12, height: 12, borderRadius: radius.full, backgroundColor: folderColor(item.color) }}
                  />
                )}
                <AppText variant={isTopic ? 'body' : 'bodyStrong'} style={{ flex: 1 }}>
                  {item.name}
                </AppText>
              </Pressable>
            );
          }}
        />
      ) : null}
    </>
  );
}
