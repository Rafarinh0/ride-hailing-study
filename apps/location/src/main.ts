import cluster from 'node:cluster';
import Redis from 'ioredis';
import { buildApp } from './app';
import { Env, loadEnv } from './config/env';
import { createDatabase } from './infrastructure/database';
import { PostgresPositionStore } from './infrastructure/postgres-position-store';
import { RedisPositionStore } from './infrastructure/redis-position-store';
import { PositionStore } from './ports/position-store';

function createStore(env: Env): PositionStore {
  return env.POSITION_STORE === 'redis'
    ? new RedisPositionStore(new Redis(env.REDIS_URL))
    : new PostgresPositionStore(createDatabase(env.DATABASE_URL!, env.DB_POOL_MAX));
}

async function startServer(env: Env) {
  const app = buildApp({ store: createStore(env) });
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

// Le e valida a config ANTES de criar processos: config errada falha uma vez, aqui,
// em vez de derrubar cada processo filho.
const env = loadEnv();

if (cluster.isPrimary && env.WORKERS > 1) {
  // O processo principal so cria e vigia os filhos. Cada filho abre a mesma porta, e
  // o sistema distribui as conexoes entre eles. Cada um tem o proprio pool de banco.
  for (let i = 0; i < env.WORKERS; i++) {
    cluster.fork();
  }
  // ponytail: so avisa. Subir outro automaticamente entraria em laco se a causa for
  // permanente (porta ocupada). Supervisao de verdade e papel do orquestrador (Etapa 9).
  cluster.on('exit', (worker, code) => {
    console.error(`processo ${worker.process.pid} saiu (codigo ${code})`);
  });
  console.log(`location: ${env.WORKERS} processos, store ${env.POSITION_STORE}, porta ${env.PORT}`);
} else {
  void startServer(env);
}
