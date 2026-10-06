import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { exportData, importData, isBackupData, photoPathsOf, type BackupData } from '@/db/backup';
import type { Database } from '@/db/database';
import { listAllPhotoPaths } from '@/db/questions';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  backupFileName,
  checkManifest,
  DATA_FILE,
  findMissingPhotos,
  isSafePhotoPath,
  MANIFEST_FILE,
  manifestErrorMessages,
  type BackupManifest,
} from '@/domain/backup';

import { today } from './date';
import { deletePhotoFiles, PHOTO_DIR } from './photos';
import { readEntries, writeEnd, writeEntry } from './tar';
import { utf8Decode, utf8Encode } from './utf8';

/**
 * Yedekleme (SPEC §11). Kural 1: kullanıcının verisi hiçbir adımda yarım kalmamalı.
 * Geri yükleme sırası:
 *   1. Arşiv önbellekte geçici klasöre açılır ve doğrulanır → hata olursa mevcut veriye dokunulmaz.
 *   2. Yeni fotoğraflar fotoğraf klasörüne eklenir (aynı adlı dosya zaten varsa korunur).
 *   3. Veritabanı tek transaction'da değiştirilir → hata olursa geri alınır, eklenen fotoğraflar silinir.
 *   4. Ancak bundan sonra hiçbir kayda bağlı olmayan eski fotoğraflar silinir.
 * Her adımda veritabanının işaret ettiği fotoğraflar diskte bulunur; en kötü durumda yetim dosya kalır.
 */

const STAGING_DIR = 'restore-staging';

async function schemaVersion(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  return row?.user_version ?? 0;
}

function jsonBytes(value: unknown): Uint8Array {
  return utf8Encode(JSON.stringify(value));
}

/** Yedek dosyasını önbellekte oluşturur. */
export async function createBackupFile(db: Database): Promise<{ uri: string; manifest: BackupManifest }> {
  const data = await exportData(db);
  const paths = [...new Set(photoPathsOf(data))];
  const present = paths.filter((p) => new File(Paths.document, p).exists);
  const missing = paths.filter((p) => !present.includes(p));

  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    backupVersion: BACKUP_VERSION,
    schemaVersion: await schemaVersion(db),
    createdAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? '',
    counts: {
      folders: data.folders.length,
      questions: data.questions.length,
      photos: present.length,
      reviews: data.review_logs.length,
    },
    missingPhotos: missing,
  };

  const file = new File(Paths.cache, backupFileName(today()));
  if (file.exists) file.delete();
  file.create();
  const handle = file.open(FileMode.Truncate);
  try {
    const writer = { write: (bytes: Uint8Array) => handle.writeBytes(bytes) };
    const mtime = Date.now() / 1000;
    writeEntry(writer, MANIFEST_FILE, jsonBytes(manifest), mtime);
    writeEntry(writer, DATA_FILE, jsonBytes(data), mtime);
    for (const path of present) {
      writeEntry(writer, path, new File(Paths.document, path).bytesSync(), mtime);
    }
    writeEnd(writer);
  } finally {
    handle.close();
  }
  return { uri: file.uri, manifest };
}

/**
 * Paylaşım menüsü (Dosyalar, AirDrop, Drive…). Dosya burada SİLİNMEZ: menü kapanmış sayılsa da
 * iOS kaydetmeyi arka planda sürdürüyor olabilir. Önbellekteki eski yedek bir sonraki yedekte değiştirilir.
 */
export async function shareBackupFile(uri: string): Promise<void> {
  await Sharing.shareAsync(uri, { UTI: 'public.data', mimeType: 'application/octet-stream', dialogTitle: 'Yedeği kaydet' });
}

export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

export type StagedBackup = { manifest: BackupManifest; data: BackupData; staging: Directory };

export class BackupError extends Error {}

/** Arşivi geçici klasöre açar ve doğrular. Mevcut veriye dokunmaz. */
export async function readBackupFile(db: Database, uri: string): Promise<StagedBackup> {
  const staging = new Directory(Paths.cache, STAGING_DIR);
  if (staging.exists) staging.delete();
  staging.create({ intermediates: true });

  let manifestValue: unknown = null;
  let dataValue: unknown = null;
  const present = new Set<string>();

  const handle = new File(uri).open(FileMode.ReadOnly);
  try {
    readEntries({ read: (length) => handle.readBytes(length) }, (name, bytes) => {
      if (name === MANIFEST_FILE) manifestValue = JSON.parse(utf8Decode(bytes));
      else if (name === DATA_FILE) dataValue = JSON.parse(utf8Decode(bytes));
      else if (isSafePhotoPath(name)) {
        const out = new File(staging, name.slice(PHOTO_DIR.length + 1));
        out.create({ overwrite: true });
        out.write(bytes);
        present.add(name);
      }
    });
  } catch (e) {
    staging.delete();
    throw e instanceof SyntaxError ? new BackupError(manifestErrorMessages.notBackup) : e;
  } finally {
    handle.close();
  }

  const check = checkManifest(manifestValue, await schemaVersion(db));
  if (!check.ok) {
    staging.delete();
    throw new BackupError(manifestErrorMessages[check.reason]);
  }
  if (!isBackupData(dataValue)) {
    staging.delete();
    throw new BackupError(manifestErrorMessages.notBackup);
  }
  // Not: şema sürümü düşük yedekler için dönüşüm burada yapılır (şimdilik tek sürüm var).
  const data: BackupData = dataValue;
  const missing = findMissingPhotos(photoPathsOf(data), present, check.manifest.missingPhotos);
  if (missing.length > 0) {
    staging.delete();
    throw new BackupError(`Yedek dosyasında ${missing.length} fotoğraf eksik; dosya bozuk olabilir.`);
  }
  return { manifest: check.manifest, data, staging };
}

/** Doğrulanmış yedeği uygular (sıra yukarıda). */
export async function applyBackup(db: Database, staged: StagedBackup): Promise<void> {
  const photos = new Directory(Paths.document, PHOTO_DIR);
  if (!photos.exists) photos.create({ intermediates: true });

  const added: string[] = [];
  try {
    for (const entry of staged.staging.list()) {
      if (!(entry instanceof File)) continue;
      const dest = new File(photos, entry.name);
      if (dest.exists) continue;
      entry.copySync(dest);
      added.push(`${PHOTO_DIR}/${entry.name}`);
    }
    await importData(db, staged.data, staged.manifest.createdAt);
  } catch (e) {
    deletePhotoFiles(added);
    throw e;
  } finally {
    if (staged.staging.exists) staged.staging.delete();
  }
  await deleteOrphanPhotos(db);
}

export function discardStagedBackup(staged: StagedBackup): void {
  if (staged.staging.exists) staged.staging.delete();
}

/** Hiçbir kayda bağlı olmayan fotoğraf dosyalarını siler (kayıtlar zaten yoksa güvenli). */
export async function deleteOrphanPhotos(db: Database): Promise<number> {
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) return 0;
  const referenced = await listAllPhotoPaths(db);
  const orphans = dir
    .list()
    .filter((entry): entry is File => entry instanceof File)
    .map((file) => `${PHOTO_DIR}/${file.name}`)
    .filter((path) => !referenced.has(path));
  deletePhotoFiles(orphans);
  return orphans.length;
}
