/**
 * Yedek dosyası biçimi (SPEC §11). Tek dosya (.bidaha) içinde TAR arşivi:
 *   manifest.json  — biçim, yedek sürümü, şema sürümü, tarih, sayılar
 *   data.json      — tüm tablolar
 *   photos/*.jpg   — fotoğraflar
 * Biçim değişirse BACKUP_VERSION artırılır ve eski sürümler içe aktarmada dönüştürülür.
 */
import { daysBetween, toLocalDate, type LocalDate } from '@/lib/date';

export const BACKUP_FORMAT = 'bidaha-backup';
export const BACKUP_VERSION = 1;
export const BACKUP_EXTENSION = 'bidaha';
export const MANIFEST_FILE = 'manifest.json';
export const DATA_FILE = 'data.json';
export const BACKUP_REMINDER_DAYS = 30;

export type BackupManifest = {
  format: typeof BACKUP_FORMAT;
  backupVersion: number;
  schemaVersion: number;
  createdAt: string;
  appVersion: string;
  counts: { folders: number; questions: number; photos: number; reviews: number };
  /** Kayıtta geçip dosyası bulunamayan fotoğraflar (içe aktarmada eksik sayılmaz). */
  missingPhotos: string[];
};

export function backupFileName(today: LocalDate): string {
  return `biDaha-yedek-${today}.${BACKUP_EXTENSION}`;
}

export type ManifestCheck =
  | { ok: true; manifest: BackupManifest }
  | { ok: false; reason: 'notBackup' | 'newerBackup' | 'newerSchema' };

export const manifestErrorMessages: Record<Exclude<ManifestCheck, { ok: true }>['reason'], string> = {
  notBackup: 'Bu dosya bir biDaha yedeği değil ya da bozuk.',
  newerBackup: 'Bu yedek uygulamanın daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle.',
  newerSchema: 'Bu yedek uygulamanın daha yeni bir sürümüyle alınmış. Önce uygulamayı güncelle.',
};

export function checkManifest(value: unknown, currentSchemaVersion: number): ManifestCheck {
  if (typeof value !== 'object' || value === null) return { ok: false, reason: 'notBackup' };
  const m = value as Partial<BackupManifest>;
  if (m.format !== BACKUP_FORMAT || typeof m.backupVersion !== 'number' || typeof m.schemaVersion !== 'number') {
    return { ok: false, reason: 'notBackup' };
  }
  if (m.backupVersion > BACKUP_VERSION) return { ok: false, reason: 'newerBackup' };
  if (m.schemaVersion > currentSchemaVersion) return { ok: false, reason: 'newerSchema' };
  return {
    ok: true,
    manifest: { ...(m as BackupManifest), missingPhotos: Array.isArray(m.missingPhotos) ? m.missingPhotos : [] },
  };
}

/** Kayıtlarda geçen ama arşivde olmayan fotoğraflar (manifestte "eksik" diye bildirilenler hariç). */
export function findMissingPhotos(
  referenced: Iterable<string>,
  present: ReadonlySet<string>,
  knownMissing: readonly string[],
): string[] {
  const known = new Set(knownMissing);
  return [...new Set(referenced)].filter((p) => !present.has(p) && !known.has(p));
}

/** Arşivde güvenli fotoğraf yolu: "photos/<ad>.jpg", klasör dışına çıkamaz. */
export function isSafePhotoPath(path: string): boolean {
  return /^photos\/[A-Za-z0-9._-]+\.jpg$/.test(path) && !path.includes('..');
}

export function daysSinceBackup(lastBackupAt: string | null, today: LocalDate): number | null {
  if (!lastBackupAt) return null;
  return Math.max(0, daysBetween(toLocalDate(new Date(lastBackupAt)), today));
}

export function lastBackupLabel(lastBackupAt: string | null, today: LocalDate): string {
  const days = daysSinceBackup(lastBackupAt, today);
  if (days === null) return 'Henüz yok';
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  return `${days} gün önce`;
}

/** Hiç yedek yokken en az bir soru varsa ya da son yedek 30 günü geçtiyse nazik hatırlatma. */
export function shouldRemindBackup(lastBackupAt: string | null, questionCount: number, today: LocalDate): boolean {
  if (questionCount === 0) return false;
  const days = daysSinceBackup(lastBackupAt, today);
  return days === null || days >= BACKUP_REMINDER_DAYS;
}
