import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/** Token de injecao do cliente Drizzle no container do Nest. */
export const DRIZZLE = Symbol('DRIZZLE');

export type Database = ReturnType<typeof createDatabase>;

/** Cria um cliente Drizzle sobre postgres.js. Conexao e preguicosa (abre na 1a query). */
export function createDatabase(url: string) {
  const client = postgres(url);
  return drizzle(client, { schema });
}
