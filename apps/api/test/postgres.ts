import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../src/database/schema';

/**
 * Sobe um Postgres real via Testcontainers, aplica as migrations do drizzle-kit
 * (pasta ./drizzle) e devolve um cliente Drizzle apontando pra ele. Base dos
 * testes de integracao da Etapa 1 — dominio sem mock de banco, banco de verdade.
 *
 * Uso:
 *   const pg = await startPostgres();
 *   // ... usa pg.db ...
 *   await pg.stop();
 */
export async function startPostgres() {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  // max:1 — o migrator prefere uma unica conexao.
  const client = postgres(container.getConnectionUri(), { max: 1 });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });

  return {
    db,
    container,
    async stop() {
      await client.end();
      await container.stop();
    },
  };
}
