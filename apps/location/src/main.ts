import { buildApp } from './app';
import { loadEnv } from './config/env';
import { createDatabase } from './infrastructure/database';
import { PostgresPositionStore } from './infrastructure/postgres-position-store';

async function main() {
  const env = loadEnv();
  const app = buildApp({ store: new PostgresPositionStore(createDatabase(env.DATABASE_URL)) });
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

void main();
