import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Trip } from '../src/modules/trip/domain/trip';
import { DrizzleTripRepository } from '../src/modules/trip/infrastructure/drizzle-trip.repository';
import { startPostgres } from './postgres';

const RIDER = '11111111-1111-4111-8111-111111111111';
const DRIVER = '22222222-2222-4222-8222-222222222222';

describe('DrizzleTripRepository (integracao)', () => {
  let pg: Awaited<ReturnType<typeof startPostgres>>;
  let repo: DrizzleTripRepository;

  beforeAll(async () => {
    pg = await startPostgres();
    repo = new DrizzleTripRepository(pg.db);
  }, 120_000);

  afterAll(async () => {
    await pg?.stop();
  });

  it('persiste o ciclo completo: cada save atualiza a mesma linha (upsert)', async () => {
    const trip = Trip.request(RIDER);
    await repo.save(trip);

    for (const step of [(t: Trip) => t.accept(DRIVER), (t: Trip) => t.start(), (t: Trip) => t.finish()]) {
      const loaded = (await repo.findById(trip.id))!;
      step(loaded);
      await repo.save(loaded);
    }

    const final = (await repo.findById(trip.id))!.toSnapshot();
    expect(final.status).toBe('finished');
    expect(final.driverId).toBe(DRIVER);
    expect(final.acceptedAt).toBeInstanceOf(Date);
    expect(final.startedAt).toBeInstanceOf(Date);
    expect(final.finishedAt).toBeInstanceOf(Date);
    expect(final.cancelledAt).toBeNull();
  });

  it('a maquina continua valendo depois do round-trip pelo banco', async () => {
    const trip = Trip.request(RIDER);
    trip.cancel();
    await repo.save(trip);

    const loaded = (await repo.findById(trip.id))!;
    expect(loaded.status).toBe('cancelled');
    expect(() => loaded.accept(DRIVER)).toThrow();
  });

  it('saveIfStatus so grava se o status no banco ainda for o esperado', async () => {
    const trip = Trip.request(RIDER);
    trip.accept(DRIVER);
    await repo.save(trip);

    const a = (await repo.findById(trip.id))!;
    const b = (await repo.findById(trip.id))!;
    a.start();
    b.cancel();

    expect(await repo.saveIfStatus(a, 'accepted')).toBe(true);
    expect(await repo.saveIfStatus(b, 'accepted')).toBe(false);
    expect((await repo.findById(trip.id))!.status).toBe('in_progress');
  });

  it('devolve null para id inexistente', async () => {
    expect(await repo.findById('99999999-9999-4999-8999-999999999999')).toBeNull();
  });
});
