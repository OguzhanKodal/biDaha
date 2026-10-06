import { router } from 'expo-router';
import { Alert } from 'react-native';

import { deleteFolder, deleteFolderWithQuestions, getFolderDeleteInfo } from '@/db/folders';
import type { FolderRow } from '@/db/types';
import { useDatabase } from '@/db/useDatabase';
import { deletePhotoFiles } from '@/lib/photos';

/**
 * Silme akışı (SPEC §3):
 * - Boş klasör (konularıyla birlikte) → onayla sil.
 * - İçinde soru varsa → soruları başka klasöre taşıyıp sil, ya da (ikinci onayla) sorularla birlikte sil.
 *   Fotoğraf dosyaları kayıtlar silindikten SONRA silinir.
 */
export function useDeleteFolder(onDeleted: () => void) {
  const db = useDatabase();

  const confirmDeleteWithQuestions = (folder: Pick<FolderRow, 'id' | 'name'>, questionCount: number) => {
    Alert.alert(
      'Bu işlem geri alınamaz',
      `"${folder.name}", konuları ve içindeki ${questionCount} soru fotoğraflarıyla birlikte kalıcı olarak silinecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hepsini sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const photos = await deleteFolderWithQuestions(db, folder.id);
              deletePhotoFiles(photos);
              onDeleted();
            } catch (e) {
              Alert.alert('Silinemedi', e instanceof Error ? e.message : String(e));
            }
          },
        },
      ],
    );
  };

  return async (folder: Pick<FolderRow, 'id' | 'name' | 'parent_id'>) => {
    const info = await getFolderDeleteInfo(db, folder.id);
    const kind = folder.parent_id === null ? 'ders' : 'konu';

    if (info.questionCount > 0) {
      Alert.alert(
        `"${folder.name}" içinde ${info.questionCount} soru var`,
        'Soruları başka bir klasöre taşıyabilir ya da sorularla birlikte silebilirsin.',
        [
          {
            text: 'Soruları taşı ve sil',
            onPress: () => router.push({ pathname: '/folders/move', params: { id: String(folder.id) } }),
          },
          {
            text: 'Sorularla birlikte sil',
            style: 'destructive',
            onPress: () => confirmDeleteWithQuestions(folder, info.questionCount),
          },
          { text: 'Vazgeç', style: 'cancel' },
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
