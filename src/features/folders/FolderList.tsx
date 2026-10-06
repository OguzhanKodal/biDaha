import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { listFolders, reorderFolders, type FolderWithStats } from '@/db/folders';
import { useDatabase } from '@/db/useDatabase';
import { moveItem } from '@/domain/folders';
import { today } from '@/lib/date';
import { useFocusedData } from '@/lib/useFocusedData';
import { useTheme } from '@/theme';

import { FolderRow } from './FolderRow';
import { useDeleteFolder } from './useDeleteFolder';

type Props = {
  /** null → dersler, sayı → o dersin konuları */
  parentId: number | null;
  editing: boolean;
  header?: ReactElement;
  /** Liste altında gösterilecek içerik (ör. dersin kendi soruları). */
  footer?: ReactElement;
};

export function openFolderForm(params: { id?: number; parentId?: number | null }) {
  router.push({
    pathname: '/folders/edit',
    params: {
      ...(params.id !== undefined ? { id: String(params.id) } : {}),
      ...(params.parentId != null ? { parentId: String(params.parentId) } : {}),
    },
  });
}

export function FolderList({ parentId, editing, header, footer }: Props) {
  const db = useDatabase();
  const { spacing } = useTheme();
  const { data: folders, error, reload } = useFocusedData(() => listFolders(db, parentId, today()));
  const deleteFolder = useDeleteFolder(reload);
  const isTopicList = parentId !== null;

  const move = async (index: number, direction: -1 | 1) => {
    if (!folders) return;
    const ordered = moveItem(folders, index, direction);
    try {
      await reorderFolders(
        db,
        ordered.map((f) => f.id),
      );
    } catch (e) {
      Alert.alert('Sıralama kaydedilemedi', e instanceof Error ? e.message : String(e));
    }
    reload();
  };

  const empty = folders ? (
    <EmptyState
      icon="folder.badge.plus"
      title={isTopicList ? 'Henüz konu yok' : 'Henüz ders yok'}
      message={
        isTopicList
          ? 'Soruları daha iyi düzenlemek için bu derse konular ekleyebilirsin (ör. Türev, Limit).'
          : 'Sorularını düzenlemek için ilk dersini ekle.'
      }
      action={
        <Button title={isTopicList ? 'Konu ekle' : 'Ders ekle'} onPress={() => openFolderForm({ parentId })} />
      }
    />
  ) : null;

  return (
    <FlatList<FolderWithStats>
      data={folders ?? []}
      keyExtractor={(f) => String(f.id)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
      ListHeaderComponent={
        <View style={{ gap: spacing.sm }}>
          {header}
          {error ? (
            <AppText color="danger">Klasörler yüklenemedi: {error.message}</AppText>
          ) : null}
        </View>
      }
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
      renderItem={({ item, index }) => (
        <FolderRow
          folder={item}
          editing={editing}
          isFirst={index === 0}
          isLast={index === (folders?.length ?? 0) - 1}
          onEdit={() => openFolderForm({ id: item.id })}
          onDelete={() => deleteFolder(item)}
          onMove={(direction) => move(index, direction)}
        />
      )}
    />
  );
}
