import { router } from 'expo-router';
import { Alert } from 'react-native';

import { deleteFolder, getFolderDeleteInfo } from '@/db/folders';
import type { FolderRow } from '@/db/types';
import { useDatabase } from '@/db/useDatabase';

/**
 * Silme akışı (SPEC §3):
 * - Boş klasör (konularıyla birlikte) → onayla sil.
 * - İçinde soru varsa → soruları başka klasöre taşı ya da vazgeç.
 *   ("Sorularla birlikte sil" fotoğraf silme eklendiğinde gelecek.)
 */
export function useDeleteFolder(onDeleted: () => void) {
  const db = useDatabase();

  return async (folder: Pick<FolderRow, 'id' | 'name' | 'parent_id'>) => {
    const info = await getFolderDeleteInfo(db, folder.id);
    const kind = folder.parent_id === null ? 'ders' : 'konu';

    if (info.questionCount > 0) {
      Alert.alert(
        `"${folder.name}" içinde ${info.questionCount} soru var`,
        'Silmeden önce soruları başka bir klasöre taşıman gerekiyor.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Soruları taşı ve sil',
            onPress: () => router.push({ pathname: '/folders/move', params: { id: String(folder.id) } }),
          },
        ],
      );
      return;
    }

    const topicNote = info.topicCount > 0 ? ` İçindeki ${info.topicCount} konu da silinecek.` : '';
    Alert.alert(`"${folder.name}" silinsin mi?`, `Bu ${kind} kalıcı olarak silinecek.${topicNote}`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFolder(db, folder.id);
            onDeleted();
          } catch (e) {
            Alert.alert('Silinemedi', e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };
}
