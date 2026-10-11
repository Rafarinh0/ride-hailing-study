import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InvalidPositionError } from '../src/domain/errors';
import { driverPosition } from '../src/domain/position';
import { RedisPositionStore } from '../src/infrastructure/redis-position-store';
import { positionStoreContract } from './position-store.contract';

describe('RedisPositionStore (integracao)', () => {
  let container: StartedRedisContainer;
  let redis: Redis;
  let store: RedisPositionStore;

  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();
    redis = new Redis(container.getConnectionUrl());
    store = new RedisPositionStore(redis);
  });

  afterAll(async () => {
    redis?.disconnect();
    await container?.stop();
  });

  positionStoreContract(() => store);

  it('latitude valida no dominio mas fora do alcance do Redis GEO vira erro de posicao', async () => {
    const polar = driverPosition(
      { driverId: '30000000-0000-4000-8000-000000000001', lat: 89, lng: 0, recordedAt: new Date('2026-01-01T11:59:00Z') },
      new Date('2026-01-01T12:00:00Z'),
    );
    await expect(store.save(polar)).rejects.toThrow(InvalidPositionError);
  });
});
