import { Inject, Injectable } from '@nestjs/common';
import { TripNotFoundError } from '../domain/errors';
import { MATCHING_STRATEGY, MatchingStrategy } from '../domain/matching-strategy';
import { TRIP_REPOSITORY, TripRepository } from '../domain/ports/trip.repository';
import { Trip, TripSnapshot } from '../domain/trip';
import { DRIVER_AVAILABILITY, DriverAvailability } from './ports/driver-availability';

/**
 * Use cases da corrida. Toda regra de transicao mora no aggregate; aqui so se
 * orquestra: carregar, transicionar, salvar — e agora, falar com o matching.
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
   * a corrida fica `requested` e ninguem tenta de novo (o "burro" do roteiro —
   * fila e nova tentativa chegam com eventos, na Etapa 4).
   */
  async request(riderId: string): Promise<TripSnapshot> {
    const trip = Trip.request(riderId);
    const driverId = await this.claimDriver();
    if (driverId) {
      trip.accept(driverId);
    }

    try {
      await this.trips.save(trip);
    } catch (error) {
      // A corrida nao foi gravada, mas o motorista ja estava reservado para ela.
      // Desfaz a reserva; senao ele some da fila ate ficar online de novo.
      if (driverId) {
        await this.availability.release(driverId);
      }
      throw error;
    }

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

  /**
   * Escolhe (Strategy) e reserva (claim). Entre listar e reservar ha um `await`,
   * e nesse intervalo outro pedido pode ter reservado o mesmo motorista. Nesse caso
   * o claim devolve false e tentamos o proximo da lista.
   */
  private async claimDriver(): Promise<string | null> {
    let candidates = await this.availability.listAvailable();
    while (candidates.length > 0) {
      const chosen = this.strategy.choose(candidates);
      if (chosen === null) {
        return null;
      }
      if (await this.availability.claim(chosen)) {
        return chosen;
      }
      candidates = candidates.filter((id) => id !== chosen);
    }
    return null;
  }

  private async freeDriver(trip: TripSnapshot): Promise<void> {
    if (trip.driverId) {
      await this.availability.release(trip.driverId);
    }
  }

  // ponytail: load -> transiciona -> save sem trava. Duas requests simultaneas
  // na mesma corrida podem ler o mesmo estado e a ultima escrita vence.
  // Concorrencia e assunto da Etapa 4 (lock / versao otimista).
  private async apply(id: string, transition: (trip: Trip) => void): Promise<TripSnapshot> {
    const trip = await this.load(id);
    transition(trip);
    await this.trips.save(trip);
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
