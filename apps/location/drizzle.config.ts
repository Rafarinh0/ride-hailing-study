import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/schema.ts',
  out: './drizzle',
  // Mesmo Postgres do apps/api, mas controle de migrations SEPARADO: cada servico
  // tem seu historico. Na tabela padrao, os journals dos dois apps se misturariam.
  // Fica no schema `drizzle`, nao no `location`: o migrator cria o schema da tabela
  // de controle antes, e a migration 0000 falharia no CREATE SCHEMA "location".
  migrations: { schema: 'drizzle', table: '__drizzle_migrations_location' },
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://ride:ride@localhost:5432/ride_hailing',
  },
});
