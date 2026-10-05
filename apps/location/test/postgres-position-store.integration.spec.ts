import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { driverPosition } from '../src/domain/position';
import { PostgresPositionStore } from '../src/infrastructure/postgres-position-store';
import { driverPositions } from '../src/infrastructure/schema';
import { startPostgres } from './postgres';

const DRIVER = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-01-01T12:00:00Z');
const at = (secondsAgo: number) => new Date(NOW.getTime() - secondsAgo * 1000);
const reading = (lat: number, secondsAgo: number, driverId = DRIVER) =>
  driverPosition({ driverId, lat, lng: -46.6, recordedAt: at(secondsAgo) }, NOW);

describe('PostgresPositionStore (integracao)', () => {
  let pg: Awaited<ReturnType<typeof startPostgres>>;
  let store: PostgresPositionStore;

  beforeAll(async () => {
    pg = await startPostgres();
    store = new PostgresPositionStore(pg.db);
  });

  afterAll(async () => {
    await pg?.stop();
  });

  it('cada leitura nova sobrescreve a anterior: uma linha por motorista', async () => {
    expect(await store.save(reading(-23.5, 30))).toBe(true);
    expect(await store.save(reading(-23.6, 20))).toBe(true);

    expect((await store.find(DRIVER))!.position.lat).toBe(-23.6);
    expect(await pg.db.select().from(driverPositions)).toHaveLength(1);
  });

  it('leitura atrasada (mais velha que a guardada) e ignorada', async () => {
    const driver = '33333333-3333-4333-8333-333333333333';
    await store.save(reading(-10, 5, driver));

    expect(await store.save(reading(-80, 15, driver))).toBe(false);
    expect((await store.find(driver))!.position.lat).toBe(-10);
  });

  it('find devolve null para motorista sem posicao', async () => {
    expect(await store.find('99999999-9999-4999-8999-999999999999')).toBeNull();
  });
});
