/**
 * Migration'ların ihtiyaç duyduğu en küçük veritabanı arayüzü.
 * expo-sqlite'ın SQLiteDatabase'i bunu karşılar; testlerde node:sqlite ile taklit edilir.
 */
export interface MigrationDatabase {
  execAsync(source: string): Promise<void>;
  getFirstAsync<T>(source: string): Promise<T | null>;
}

export interface MigratableDatabase extends MigrationDatabase {
  withExclusiveTransactionAsync(task: (txn: MigrationDatabase) => Promise<void>): Promise<void>;
}

export type Migration = {
  /** Sıradaki tam sayı; `PRAGMA user_version` bu değere ayarlanır. */
  version: number;
  name: string;
  up: (db: MigrationDatabase) => Promise<void>;
};
