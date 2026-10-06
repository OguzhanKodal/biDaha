import {
  backupFileName,
  BACKUP_VERSION,
  checkManifest,
  findMissingPhotos,
  isSafePhotoPath,
  lastBackupLabel,
  shouldRemindBackup,
} from '@/domain/backup';

const today = '2026-10-06';

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    format: 'bidaha-backup',
    backupVersion: 1,
    schemaVersion: 1,
    createdAt: '2026-10-06T10:00:00.000Z',
    appVersion: '1.0.0',
    counts: { folders: 1, questions: 2, photos: 3, reviews: 4 },
    missingPhotos: [],
    ...overrides,
  };
}

describe('backupFileName', () => {
  it('tarihli .bidaha adı verir', () => {
    expect(backupFileName(today)).toBe('biDaha-yedek-2026-10-06.bidaha');
  });
});

describe('checkManifest', () => {
  it('geçerli manifesti kabul eder', () => {
    expect(checkManifest(manifest(), 1)).toMatchObject({ ok: true });
  });

  it('başka dosyaları reddeder', () => {
    expect(checkManifest(null, 1)).toEqual({ ok: false, reason: 'notBackup' });
    expect(checkManifest({ format: 'zip' }, 1)).toEqual({ ok: false, reason: 'notBackup' });
    expect(checkManifest(manifest({ schemaVersion: '1' }), 1)).toEqual({ ok: false, reason: 'notBackup' });
  });

  it('daha yeni sürümle alınmış yedeği reddeder', () => {
    expect(checkManifest(manifest({ backupVersion: BACKUP_VERSION + 1 }), 1)).toEqual({ ok: false, reason: 'newerBackup' });
    expect(checkManifest(manifest({ schemaVersion: 2 }), 1)).toEqual({ ok: false, reason: 'newerSchema' });
  });

  it('eksik missingPhotos alanını boş liste sayar', () => {
    const result = checkManifest(manifest({ missingPhotos: undefined }), 1);
    expect(result.ok && result.manifest.missingPhotos).toEqual([]);
  });
});

describe('findMissingPhotos', () => {
  it('arşivde olmayan ve eksik bildirilmemiş fotoğrafları bulur', () => {
    const present = new Set(['photos/a.jpg']);
    expect(findMissingPhotos(['photos/a.jpg', 'photos/b.jpg', 'photos/c.jpg', 'photos/b.jpg'], present, ['photos/c.jpg'])).toEqual([
      'photos/b.jpg',
    ]);
  });
});

describe('isSafePhotoPath', () => {
  it('sadece photos/ altındaki düz jpg adlarına izin verir', () => {
    expect(isSafePhotoPath('photos/mf1x2-ab12cd34.jpg')).toBe(true);
    expect(isSafePhotoPath('photos/../settings.db')).toBe(false);
    expect(isSafePhotoPath('../photos/a.jpg')).toBe(false);
    expect(isSafePhotoPath('photos/sub/a.jpg')).toBe(false);
    expect(isSafePhotoPath('data.json')).toBe(false);
  });
});

describe('lastBackupLabel / shouldRemindBackup', () => {
  const daysAgo = (n: number) => new Date(2026, 9, 6 - n, 12).toISOString();

  it('son yedek zamanını yazar', () => {
    expect(lastBackupLabel(null, today)).toBe('Henüz yok');
    expect(lastBackupLabel(daysAgo(0), today)).toBe('Bugün');
    expect(lastBackupLabel(daysAgo(1), today)).toBe('Dün');
    expect(lastBackupLabel(daysAgo(12), today)).toBe('12 gün önce');
  });

  it('soru varken hiç yedek yoksa ya da 30 gün geçtiyse hatırlatır', () => {
    expect(shouldRemindBackup(null, 0, today)).toBe(false);
    expect(shouldRemindBackup(null, 3, today)).toBe(true);
    expect(shouldRemindBackup(daysAgo(29), 3, today)).toBe(false);
    expect(shouldRemindBackup(daysAgo(30), 3, today)).toBe(true);
  });
});
