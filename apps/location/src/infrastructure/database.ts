import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

/** Pool do postgres.js: ate 10 conexoes por padrao. Numero que a Milestone 3 vai medir. */
export function createDatabase(url: string) {
  return drizzle(postgres(url), { schema });
}
