import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../src/infrastructure/schema';

/** Postgres real via Testcontainers, com as migrations do location aplicadas. */
export async function startPostgres() {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const client = postgres(container.getConnectionUri(), { max: 1 });
  const db = drizzle(client, { schema });

  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), 'drizzle'),
    migrationsSchema: 'drizzle', // mesma tabela de controle do drizzle.config.ts
    migrationsTable: '__drizzle_migrations_location',
  });

  return {
    db,
    async stop() {
      await client.end();
      await container.stop();
    },
  };
}
