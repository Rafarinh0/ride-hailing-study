import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgresPositionStore } from '../src/infrastructure/postgres-position-store';
import { driverPositions } from '../src/infrastructure/schema';
import { startPostgres } from './postgres';
import { positionStoreContract, reading } from './position-store.contract';

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

  positionStoreContract(() => store);

  it('uma linha por motorista, por mais leituras que cheguem', async () => {
    const id = '20000000-0000-4000-8000-000000000001';
    for (let s = 50; s > 0; s -= 10) {
      await store.save(reading(id, -23.5, s));
    }
    const rows = (await pg.db.select().from(driverPositions)).filter((r) => r.driverId === id);
    expect(rows).toHaveLength(1);
  });
});
