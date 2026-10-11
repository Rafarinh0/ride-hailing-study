import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

/**
 * `maxConnections` e o tamanho do pool: quantas queries podem estar no Postgres ao
 * mesmo tempo. As demais esperam na fila do postgres.js.
 */
export function createDatabase(url: string, maxConnections = 10) {
  return drizzle(postgres(url, { max: maxConnections }), { schema });
}
