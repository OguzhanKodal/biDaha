import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { coversWholeImage, photoJpegQuality, resizeTarget, type Rect, type Size } from '@/domain/crop';

/**
 * Fotoğraf dosyaları: Documents/photos/ altında. Veritabanına göreli yol ("photos/x.jpg") yazılır,
 * çünkü iOS'ta uygulama klasörünün mutlak yolu güncellemelerde değişebilir.
 *
 * Kural: Bir fotoğraf dosyası, ona işaret eden veritabanı kaydı silinmeden ÖNCE silinmez.
 */
export const PHOTO_DIR = 'photos';

/** Düzenlenmiş ama henüz kalıcı klasöre taşınmamış (önbellekteki) fotoğraf. */
export type TempPhoto = Size & { uri: string };

function photoDirectory(): Directory {
  return new Directory(Paths.document, PHOTO_DIR);
}

/** Göreli yoldan görüntülenebilir URI. */
export function photoUri(relativePath: string): string {
  return new File(Paths.document, relativePath).uri;
}

function newPhotoName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
}

/** Önbellekteki fotoğrafı kalıcı klasöre taşır; göreli yolu döner. */
export async function persistPhoto(tempUri: string): Promise<string> {
  const dir = photoDirectory();
  if (!dir.exists) dir.create({ intermediates: true });
  const name = newPhotoName();
  await new File(tempUri).copy(new File(dir, name));
  return `${PHOTO_DIR}/${name}`;
}

/** Dosyaları siler; olmayanları ve hataları yok sayar (kayıt zaten silinmiş olmalı). */
export function deletePhotoFiles(relativePaths: readonly string[]): void {
  for (const path of relativePaths) {
    try {
      const file = new File(Paths.document, path);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn('Fotoğraf silinemedi', path, e);
    }
  }
}

/** SADECE GELİŞTİRME sıfırlaması için: tüm fotoğraf klasörünü siler. */
export function deleteAllPhotoFiles(): void {
  const dir = photoDirectory();
  if (dir.exists) dir.delete();
}

/** Görüntüyü 90° döndürür (yüksek kalite, önbelleğe). */
export async function rotatePhoto(uri: string, degrees: 90 | -90): Promise<TempPhoto> {
  const image = await ImageManipulator.manipulate(uri).rotate(degrees).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/** Kırpar (gerekiyorsa), uzun kenarı 1600 px'e indirir, JPEG %70 kaydeder (önbelleğe). */
export async function finalizePhoto(source: TempPhoto, crop: Rect | null): Promise<TempPhoto> {
  const context = ImageManipulator.manipulate(source.uri);
  let size: Size = { width: source.width, height: source.height };
  if (crop && !coversWholeImage(crop, size)) {
    context.crop({ originX: crop.x, originY: crop.y, width: crop.width, height: crop.height });
    size = { width: crop.width, height: crop.height };
  }
  const target = resizeTarget(size);
  if (target) context.resize({ width: target.width });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: photoJpegQuality });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

export type PhotoSource = 'camera' | 'library';

/** Kameradan ya da galeriden tek fotoğraf alır; vazgeçilirse null. */
export async function pickPhoto(source: PhotoSource): Promise<TempPhoto | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Kamera izni gerekli', 'Soru fotoğrafı çekebilmek için Ayarlar’dan kamera iznini açabilirsin.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayarlar’ı aç', onPress: () => Linking.openSettings() },
      ]);
      return null;
    }
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

/** "Kamera / Galeri" seçimi. */
export function askPhotoSource(title: string): Promise<PhotoSource | null> {
  return new Promise((resolve) => {
    Alert.alert(title, undefined, [
      { text: 'Fotoğraf çek', onPress: () => resolve('camera') },
      { text: 'Galeriden seç', onPress: () => resolve('library') },
      { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
