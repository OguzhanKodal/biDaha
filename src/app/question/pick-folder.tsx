import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { listFolderTree } from '@/db/folders';
import type { FolderRow } from '@/db/types';
import { useDatabase } from '@/db/useDatabase';
import { PICK_FOLDER_REQUEST } from '@/features/questions/photoFlow';
import { getPendingInput, resolvePending } from '@/lib/pendingResult';
import { useFocusedData } from '@/lib/useFocusedData';
import { minTouchSize, useTheme } from '@/theme';

/** Soru için klasör seçimi. Girdi: seçili klasör id'si; sonuç: seçilen klasör. */
export default function PickFolderScreen() {
  const db = useDatabase();
  const { colors, spacing, radius, folderColor } = useTheme();
  const selectedId = getPendingInput<number | null>(PICK_FOLDER_REQUEST);
  const { data: folders } = useFocusedData(() => listFolderTree(db));

  useEffect(() => () => resolvePending(PICK_FOLDER_REQUEST, null), []);

  const choose = (folder: FolderRow) => {
    resolvePending(PICK_FOLDER_REQUEST, folder);
    router.back();
  };

  return (
    <FlatList
      data={folders ?? []}
      keyExtractor={(f) => String(f.id)}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xs }}
      ListEmptyComponent={
        folders ? (
          <EmptyState icon="folder.badge.plus" title="Henüz klasör yok" message="Önce Klasörler sekmesinden bir ders ekle." />
        ) : null
      }
      renderItem={({ item }) => {
        const isTopic = item.parent_id !== null;
        const selected = item.id === selectedId;
        return (
          <Pressable
            onPress={() => choose(item)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={isTopic ? `Konu: ${item.name}` : `Ders: ${item.name}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              minHeight: minTouchSize + 4,
              paddingHorizontal: spacing.lg,
              marginLeft: isTopic ? spacing.xl : 0,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: selected ? colors.accent : colors.surface,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.7 : 1,
            })}>
            {isTopic ? (
              <Icon name="arrow.turn.down.right" size={14} color="textSecondary" />
            ) : (
              <View style={{ width: 12, height: 12, borderRadius: radius.full, backgroundColor: folderColor(item.color) }} />
            )}
            <AppText variant={isTopic ? 'body' : 'bodyStrong'} style={{ flex: 1 }}>
              {item.name}
            </AppText>
            {selected ? <Icon name="checkmark" size={16} color="accent" /> : null}
          </Pressable>
        );
      }}
    />
  );
}
