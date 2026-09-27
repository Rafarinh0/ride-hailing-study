import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS, EventBus } from '../../../common/events/event-bus';
import { TRIP_FINISHED, TripFinishedEvent } from '../../../contracts/trip-finished';
import { Charge, ChargeSnapshot } from '../domain/charge';
import { ChargeNotFoundError } from '../domain/errors';
import { calculateFare } from '../domain/fare';
import { CHARGE_REPOSITORY, ChargeRepository } from '../domain/ports/charge.repository';

/**
 * O payment REAGE ao fim da corrida: quem avisa e o evento, nao uma chamada do trip.
 * O trip nao sabe que o payment existe; o payment conhece so o contrato do evento.
 */
@Injectable()
export class PaymentUseCases implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly events: EventBus,
    @Inject(CHARGE_REPOSITORY) private readonly charges: ChargeRepository,
  ) {}

  onModuleInit(): void {
    this.events.subscribe<TripFinishedEvent>(TRIP_FINISHED, (event) => this.chargeFinishedTrip(event));
  }

  /**
   * Idempotente: se o mesmo trip.finished chegar duas vezes, a segunda nao cobra
   * (CLAUDE.md: "assuma at-least-once"). Em processo isso ainda nao acontece; com
   * Kafka (Etapa 3) acontece, e o handler ja esta pronto.
   */
  async chargeFinishedTrip(event: TripFinishedEvent): Promise<void> {
    const charge = Charge.forTrip({
      tripId: event.tripId,
      riderId: event.riderId,
      driverId: event.driverId,
      amount: calculateFare(event.startedAt, event.finishedAt),
    });
    await this.charges.saveIfNew(charge);
  }

  async chargeOf(tripId: string): Promise<ChargeSnapshot> {
    const charge = await this.charges.findByTripId(tripId);
    if (!charge) {
      throw new ChargeNotFoundError(tripId);
    }
    return charge.toSnapshot();
  }
}
