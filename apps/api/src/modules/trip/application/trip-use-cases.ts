import { Inject, Injectable } from '@nestjs/common';
import { ConcurrentTripUpdateError, InvalidTripTransitionError, TripNotFoundError } from '../domain/errors';
import { MATCHING_STRATEGY, MatchingStrategy } from '../domain/matching-strategy';
import { TRIP_REPOSITORY, TripRepository } from '../domain/ports/trip.repository';
import { Trip, TripSnapshot } from '../domain/trip';
import { canTransition } from '../domain/trip-status';
import { DRIVER_AVAILABILITY, DriverAvailability } from './ports/driver-availability';

/**
 * Use cases da corrida e da disponibilidade dos motoristas. Toda regra de transicao
 * mora no aggregate; aqui so se orquestra: carregar, transicionar, gravar, e falar
 * com o matching.
 */
@Injectable()
export class TripUseCases {
  constructor(
    @Inject(TRIP_REPOSITORY) private readonly trips: TripRepository,
    @Inject(DRIVER_AVAILABILITY) private readonly availability: DriverAvailability,
    @Inject(MATCHING_STRATEGY) private readonly strategy: MatchingStrategy,
  ) {}

  /**
   * Matching sincrono: a resposta ja diz se achou motorista. Sem motorista livre,
   * a corrida fica `requested`; POST /trips/:id/match tenta de novo.
   */
  async request(riderId: string): Promise<TripSnapshot> {
    const trip = Trip.request(riderId);
    await this.assignDriverAndSave(trip, async () => {
      await this.trips.save(trip);
      return true;
    });
    return trip.toSnapshot();
  }

  /** Nova tentativa de matching para uma corrida que ficou sem motorista. */
  async match(id: string): Promise<TripSnapshot> {
    const trip = await this.load(id);
    // Confere ANTES de reservar: reservar e so depois descobrir que a corrida nao
    // aceita motorista deixaria alguem preso a toa.
    if (!canTransition(trip.status, 'accepted')) {
      throw new InvalidTripTransitionError(trip.status, 'accepted');
    }
    await this.assignDriverAndSave(trip, () => this.trips.saveIfStatus(trip, 'requested'));
    return trip.toSnapshot();
  }

  start(id: string): Promise<TripSnapshot> {
    return this.apply(id, (trip) => trip.start());
  }

  async finish(id: string): Promise<TripSnapshot> {
    const trip = await this.apply(id, (t) => t.finish());
    await this.freeDriver(trip);
    return trip;
  }

  async cancel(id: string): Promise<TripSnapshot> {
    const trip = await this.apply(id, (t) => t.cancel());
    await this.freeDriver(trip);
    return trip;
  }

  async get(id: string): Promise<TripSnapshot> {
    return (await this.load(id)).toSnapshot();
  }

  goOnline(driverId: string): Promise<void> {
    return this.availability.goOnline(driverId);
  }

  goOffline(driverId: string): Promise<void> {
    return this.availability.goOffline(driverId);
  }

  /**
   * Reserva um motorista (se houver) e grava. Se a gravacao falhar, ou perder para
   * outra requisicao, desfaz a reserva; senao o motorista some da fila.
   */
  private async assignDriverAndSave(trip: Trip, persist: () => Promise<boolean>): Promise<void> {
    const driverId = await this.claimDriver(trip.id);
    if (driverId) {
      trip.accept(driverId);
    }

    let saved = false;
    try {
      saved = await persist();
    } finally {
      if (!saved && driverId) {
        await this.availability.release(driverId, trip.id);
      }
    }
    if (!saved) {
      throw new ConcurrentTripUpdateError(trip.id);
    }
  }

  /**
   * Escolhe (Strategy) e reserva (claim). Entre listar e reservar ha um `await`,
   * e nesse intervalo outro pedido pode ter reservado o mesmo motorista. Nesse caso
   * o claim devolve false e tentamos o proximo da lista.
   */
  private async claimDriver(tripId: string): Promise<string | null> {
    let candidates = await this.availability.listAvailable();
    while (candidates.length > 0) {
      const chosen = this.strategy.choose(candidates);
      // Uma estrategia que devolve algo fora da lista nao pode prender o laco.
      if (chosen === null || !candidates.includes(chosen)) {
        return null;
      }
      if (await this.availability.claim(chosen, tripId)) {
        return chosen;
      }
      candidates = candidates.filter((id) => id !== chosen);
    }
    return null;
  }

  private async freeDriver(trip: TripSnapshot): Promise<void> {
    if (trip.driverId) {
      await this.availability.release(trip.driverId, trip.id);
    }
  }

  /**
   * Grava so se a corrida ainda estiver no status lido (concorrencia otimista). Se
   * outra requisicao mudou antes, esta perde com 409 e nao gera efeito colateral,
   * como liberar o motorista de uma corrida que na verdade comecou.
   */
  private async apply(id: string, transition: (trip: Trip) => void): Promise<TripSnapshot> {
    const trip = await this.load(id);
    const readStatus = trip.status;
    transition(trip);
    if (!(await this.trips.saveIfStatus(trip, readStatus))) {
      throw new ConcurrentTripUpdateError(id);
    }
    return trip.toSnapshot();
  }

  private async load(id: string): Promise<Trip> {
    const trip = await this.trips.findById(id);
    if (!trip) {
      throw new TripNotFoundError(id);
    }
    return trip;
  }
}
