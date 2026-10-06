/**
 * Sorgu fonksiyonlarının kullandığı veritabanı arayüzü.
 * Uygulamada expo-sqlite'ın SQLiteDatabase'i, testlerde node:sqlite sarmalayıcısı geçirilir.
 *
 * Yazma işlemlerinde withTransactionAsync kullan: withExclusiveTransactionAsync ayrı bir
 * bağlantı açar ve orada `foreign_keys` kapalıdır, yani silme korumaları çalışmaz.
 */
export type BindValue = string | number | null;

export type RunResult = {
  lastInsertRowId: number;
  changes: number;
};

export interface Database {
  runAsync(source: string, params: BindValue[]): Promise<RunResult>;
  getFirstAsync<T>(source: string, params: BindValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, params: BindValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
