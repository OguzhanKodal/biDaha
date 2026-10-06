import type { MigratableDatabase } from '@/db/migrations/types';

// Node 22'nin yerleşik SQLite'ı; Jest'in modül çözümlemesini atlamak için getBuiltinModule ile alınır.
type StatementSync = {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): unknown;
};
type DatabaseSync = {
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
  close(): void;
};
type NodeSqliteModule = { DatabaseSync: new (path: string) => DatabaseSync };

const { DatabaseSync } = (
  process as unknown as { getBuiltinModule(id: string): NodeSqliteModule }
).getBuiltinModule('node:sqlite');

/** Testler için expo-sqlite benzeri, bellek içi veritabanı. */
export class TestDatabase implements MigratableDatabase {
  readonly raw: DatabaseSync = new DatabaseSync(':memory:');

  constructor() {
    this.raw.exec('PRAGMA foreign_keys = ON');
  }

  async execAsync(source: string): Promise<void> {
    this.raw.exec(source);
  }

  async getFirstAsync<T>(source: string): Promise<T | null> {
    return (this.raw.prepare(source).get() as T | undefined) ?? null;
  }

  async withExclusiveTransactionAsync(task: (txn: MigratableDatabase) => Promise<void>): Promise<void> {
    this.raw.exec('BEGIN EXCLUSIVE');
    try {
      await task(this);
      this.raw.exec('COMMIT');
    } catch (error) {
      this.raw.exec('ROLLBACK');
      throw error;
    }
  }

  all<T>(sql: string, ...params: unknown[]): T[] {
    return this.raw.prepare(sql).all(...params) as T[];
  }

  run(sql: string, ...params: unknown[]): void {
    this.raw.prepare(sql).run(...params);
  }

  close(): void {
    this.raw.close();
  }
}
