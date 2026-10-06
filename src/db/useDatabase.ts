import { useSQLiteContext } from 'expo-sqlite';

import type { Database } from './database';

/** Ekranlarda veritabanına erişim; sorgu fonksiyonlarına bu nesne geçirilir. */
export function useDatabase(): Database {
  return useSQLiteContext();
}
