import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InProcessEventBus } from '../src/common/events/in-process-event-bus';
import { TRIP_FINISHED } from '../src/contracts/trip-finished';
import { DrizzleUnitOfWork } from '../src/database/transaction';
import { PaymentUseCases } from '../src/modules/payment/application/payment-use-cases';
import { DrizzleChargeRepository } from '../src/modules/payment/infrastructure/drizzle-charge.repository';
import { charges as chargesTable } from '../src/modules/payment/infrastructure/schema';
import { TripUseCases } from '../src/modules/trip/application/trip-use-cases';
import { FirstAvailableStrategy } from '../src/modules/trip/domain/first-available.strategy';
import { DrizzleTripRepository } from '../src/modules/trip/infrastructure/drizzle-trip.repository';
import { InMemoryDriverAvailability } from '../src/modules/trip/infrastructure/in-memory-driver-availability';
import { startPostgres } from './postgres';

const RIDER = '11111111-1111-4111-8111-111111111111';
const DRIVER = '22222222-2222-4222-8222-222222222222';

describe('finalizar corrida + cobranca (integracao)', () => {
  let pg: Awaited<ReturnType<typeof startPostgres>>;
  let charges: DrizzleChargeRepository;
  let tripRepo: DrizzleTripRepository;

  beforeAll(async () => {
    pg = await startPostgres();
    charges = new DrizzleChargeRepository(pg.db);
    tripRepo = new DrizzleTripRepository(pg.db);
  }, 120_000);

  afterAll(async () => {
    await pg?.stop();
  });

  /** Monta a app "a mao", com os mesmos objetos que o Nest ligaria. */
  function setup(extraHandler?: () => Promise<void>) {
    const bus = new InProcessEventBus();
    const payments = new PaymentUseCases(bus, charges);
    payments.onModuleInit();
    if (extraHandler) {
      bus.subscribe(TRIP_FINISHED, extraHandler);
    }
    const availability = new InMemoryDriverAvailability();
    const trips = new TripUseCases(
      tripRepo,
      availability,
      new FirstAvailableStrategy(),
      new DrizzleUnitOfWork(pg.db),
      bus,
    );
    return { trips, payments, availability };
  }

  async function tripInProgress(app: ReturnType<typeof setup>): Promise<string> {
    await app.availability.goOnline(DRIVER);
    const trip = await app.trips.request(RIDER);
    await app.trips.start(trip.id);
    return trip.id;
  }

  it('finalizar gera a cobranca no ledger, com lancamentos que somam zero', async () => {
    const app = setup();
    const id = await tripInProgress(app);

    await app.trips.finish(id);

    const charge = await app.payments.chargeOf(id);
    expect(charge.amountCents).toBe(550); // R$ 5,00 + 1 minuto
    expect(charge.entries.map((e) => [e.account, e.amountCents])).toEqual([
      ['rider', -550],
      ['driver', 440],
      ['platform', 110],
    ]);
  });

  it('o mesmo trip.finished entregue duas vezes gera uma cobranca so', async () => {
    const app = setup();
    const id = await tripInProgress(app);
    const finished = await app.trips.finish(id);

    await app.payments.chargeFinishedTrip({
      type: TRIP_FINISHED,
      tripId: id,
      riderId: RIDER,
      driverId: DRIVER,
      startedAt: finished.startedAt!,
      finishedAt: finished.finishedAt!,
    });

    expect(await pg.db.select().from(chargesTable).where(eq(chargesTable.tripId, id))).toHaveLength(1);
    expect((await charges.findByTripId(id))!.entries).toHaveLength(3);
  });

  it('se algo falha depois da cobranca, o rollback desfaz tudo: corrida em curso, sem cobranca', async () => {
    // O payment grava a cobranca primeiro; este segundo handler falha em seguida.
    const app = setup(async () => {
      throw new Error('falha depois de gravar a cobranca');
    });
    const id = await tripInProgress(app);

    await expect(app.trips.finish(id)).rejects.toThrow('falha depois de gravar a cobranca');

    expect((await tripRepo.findById(id))!.status).toBe('in_progress');
    expect(await charges.findByTripId(id)).toBeNull();
    expect(await app.availability.listAvailable()).toEqual([]); // motorista segue na corrida
  });
});
