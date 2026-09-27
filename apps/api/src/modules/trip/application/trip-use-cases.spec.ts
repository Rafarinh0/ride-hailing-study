import { beforeEach, describe, expect, it } from 'vitest';
import { ConcurrentTripUpdateError } from '../domain/errors';
import { FirstAvailableStrategy } from '../domain/first-available.strategy';
import { TripRepository } from '../domain/ports/trip.repository';
import { Trip, TripSnapshot } from '../domain/trip';
import { TripStatus } from '../domain/trip-status';
import { InMemoryDriverAvailability } from '../infrastructure/in-memory-driver-availability';
import { TripUseCases } from './trip-use-cases';

const RIDER = '11111111-1111-4111-8111-111111111111';

/** Repositorio falso: guarda snapshots num Map. `failNextSave` simula o banco caindo. */
class InMemoryTripRepository implements TripRepository {
  rows = new Map<string, TripSnapshot>();
  failNextSave = false;

  async save(trip: Trip): Promise<void> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error('banco fora do ar');
    }
    this.rows.set(trip.id, trip.toSnapshot());
  }

  async saveIfStatus(trip: Trip, expected: TripStatus): Promise<boolean> {
    if (this.rows.get(trip.id)?.status !== expected) {
      return false;
    }
    this.rows.set(trip.id, trip.toSnapshot());
    return true;
  }

  async findById(id: string): Promise<Trip | null> {
    const row = this.rows.get(id);
    return row ? Trip.rehydrate(row) : null;
  }
}

describe('TripUseCases (matching)', () => {
  let trips: InMemoryTripRepository;
  let availability: InMemoryDriverAvailability;
  let useCases: TripUseCases;

  beforeEach(() => {
    trips = new InMemoryTripRepository();
    availability = new InMemoryDriverAvailability();
    useCases = new TripUseCases(trips, availability, new FirstAvailableStrategy());
  });

  it('pedido com motorista livre ja sai aceito, com o primeiro da fila', async () => {
    await availability.goOnline('d1');
    await availability.goOnline('d2');

    const trip = await useCases.request(RIDER);

    expect(trip.status).toBe('accepted');
    expect(trip.driverId).toBe('d1');
    expect(await availability.listAvailable()).toEqual(['d2']);
  });

  it('sem motorista livre, a corrida fica solicitada e sem motorista', async () => {
    const trip = await useCases.request(RIDER);
    expect(trip.status).toBe('requested');
    expect(trip.driverId).toBeNull();
  });

  it('match tenta de novo quando um motorista fica online depois', async () => {
    const trip = await useCases.request(RIDER);
    await availability.goOnline('d1');

    const matched = await useCases.match(trip.id);

    expect(matched.status).toBe('accepted');
    expect(matched.driverId).toBe('d1');
  });

  it('dois pedidos simultaneos com um motorista: so um leva', async () => {
    await availability.goOnline('d1');

    const [a, b] = await Promise.all([useCases.request(RIDER), useCases.request(RIDER)]);

    expect([a.driverId, b.driverId].filter(Boolean)).toEqual(['d1']);
  });

  it('finalizar devolve o motorista para a fila', async () => {
    await availability.goOnline('d1');
    const trip = await useCases.request(RIDER);
    await useCases.start(trip.id);
    await useCases.finish(trip.id);

    expect(await availability.listAvailable()).toEqual(['d1']);
  });

  it('cancelar devolve o motorista para a fila', async () => {
    await availability.goOnline('d1');
    const trip = await useCases.request(RIDER);
    await useCases.cancel(trip.id);

    expect(await availability.listAvailable()).toEqual(['d1']);
  });

  it('se gravar a corrida falhar, o motorista reservado volta para a fila', async () => {
    await availability.goOnline('d1');
    trips.failNextSave = true;

    await expect(useCases.request(RIDER)).rejects.toThrow('banco fora do ar');
    expect(await availability.listAvailable()).toEqual(['d1']);
  });

  it('start e cancel simultaneos: um perde com conflito e o motorista nao e solto no meio da corrida', async () => {
    await availability.goOnline('d1');
    const trip = await useCases.request(RIDER);

    const results = await Promise.allSettled([useCases.start(trip.id), useCases.cancel(trip.id)]);

    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConcurrentTripUpdateError);
    const final = (await useCases.get(trip.id)).status;
    expect(await availability.listAvailable()).toEqual(final === 'cancelled' ? ['d1'] : []);
  });

  it('finalizar uma corrida antiga nao solta o motorista que ja esta em outra (API reiniciou)', async () => {
    await availability.goOnline('d1');
    const old = await useCases.request(RIDER);

    // Reinicio: a memoria some, o repositorio (banco) continua.
    availability = new InMemoryDriverAvailability();
    useCases = new TripUseCases(trips, availability, new FirstAvailableStrategy());
    await availability.goOnline('d1');
    const current = await useCases.request(RIDER);
    expect(current.driverId).toBe('d1');

    await useCases.start(old.id);
    await useCases.finish(old.id);

    expect(await availability.listAvailable()).toEqual([]);
  });

  it('estrategia que devolve id fora da lista nao trava o pedido', async () => {
    await availability.goOnline('d1');
    const ghost = new TripUseCases(trips, availability, { choose: () => 'fantasma' });

    const trip = await ghost.request(RIDER);

    expect(trip.status).toBe('requested');
  });
});
