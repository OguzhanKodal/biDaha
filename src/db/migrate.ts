import { migrations as defaultMigrations } from './migrations';
import type { MigratableDatabase, Migration, MigrationDatabase } from './migrations/types';

export async function getSchemaVersion(db: MigrationDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/**
 * Bekleyen migration'ları sırayla çalıştırır. Her migration ve sürüm güncellemesi
 * aynı transaction içindedir: hata olursa o migration tamamen geri alınır.
 */
export async function migrate(
  db: MigratableDatabase,
  migrations: readonly Migration[] = defaultMigrations,
): Promise<void> {
  assertSequential(migrations);
  const latest = migrations.at(-1)?.version ?? 0;
  const current = await getSchemaVersion(db);

  if (current > latest) {
    // Daha yeni bir sürümün (ör. yedekten) oluşturduğu veritabanı: dokunma.
    throw new Error(
      `Veritabanı sürümü (${current}) uygulamanın desteklediğinden (${latest}) yeni.`,
    );
  }

  for (const migration of migrations) {
    if (migration.version <= current) continue;
    await db.withExclusiveTransactionAsync(async (txn) => {
      await migration.up(txn);
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

function assertSequential(migrations: readonly Migration[]): void {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(`Migration sırası bozuk: ${migration.name} sürümü ${index + 1} olmalı.`);
    }
  });
}
