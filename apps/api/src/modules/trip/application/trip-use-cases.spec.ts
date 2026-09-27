import { beforeEach, describe, expect, it } from 'vitest';
import { FirstAvailableStrategy } from '../domain/first-available.strategy';
import { TripRepository } from '../domain/ports/trip.repository';
import { Trip, TripSnapshot } from '../domain/trip';
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
});
