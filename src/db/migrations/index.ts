import { migration001Initial } from './001_initial';
import type { Migration } from './types';

/** Sırayla çalışır. Yeni migration sona eklenir; mevcutlar değiştirilmez. */
export const migrations: readonly Migration[] = [migration001Initial];
