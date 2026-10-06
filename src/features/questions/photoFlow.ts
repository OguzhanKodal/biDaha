import { router } from 'expo-router';

import type { FolderRow } from '@/db/types';
import { askPhotoSource, pickPhoto, type TempPhoto } from '@/lib/photos';
import { requestResult } from '@/lib/pendingResult';

export const CROP_REQUEST = 'question/crop';
export const PICK_FOLDER_REQUEST = 'question/pick-folder';

/** Kırpma/döndürme ekranını açar; kullanılan (sıkıştırılmış) fotoğrafı ya da null döner. */
export function editPhoto(photo: TempPhoto): Promise<TempPhoto | null> {
  return requestResult<TempPhoto, TempPhoto>(CROP_REQUEST, photo, () => router.push('/question/crop'));
}

/** Kaynak seç → fotoğraf al → kırp. Herhangi bir adımda vazgeçilirse null. */
export async function capturePhoto(title: string): Promise<TempPhoto | null> {
  const source = await askPhotoSource(title);
  if (!source) return null;
  const picked = await pickPhoto(source);
  if (!picked) return null;
  return editPhoto(picked);
}

/** Klasör seçme ekranını açar; seçilen klasörü ya da null döner. */
export function pickFolder(selectedId: number | null): Promise<FolderRow | null> {
  return requestResult<number | null, FolderRow>(PICK_FOLDER_REQUEST, selectedId, () =>
    router.push('/question/pick-folder'),
  );
}
