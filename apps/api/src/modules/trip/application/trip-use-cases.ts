import { Inject, Injectable } from '@nestjs/common';
import { TripNotFoundError } from '../domain/errors';
import { TRIP_REPOSITORY, TripRepository } from '../domain/ports/trip.repository';
import { Trip, TripSnapshot } from '../domain/trip';

/**
 * Use cases da corrida. Uma classe so (em vez de uma por use case, como o
 * RegisterRider) porque as 4 transicoes tem o MESMO formato: carrega, aplica a
 * transicao, salva. Quatro arquivos quase identicos seriam ruido.
 *
 * Toda regra (pode ou nao transicionar) mora no aggregate. Aqui so orquestra.
 */
@Injectable()
export class TripUseCases {
  constructor(@Inject(TRIP_REPOSITORY) private readonly trips: TripRepository) {}

  async request(riderId: string): Promise<{ id: string }> {
    const trip = Trip.request(riderId);
    await this.trips.save(trip);
    return { id: trip.id };
  }

  accept(id: string, driverId: string): Promise<TripSnapshot> {
    return this.apply(id, (trip) => trip.accept(driverId));
  }

  start(id: string): Promise<TripSnapshot> {
    return this.apply(id, (trip) => trip.start());
  }

  finish(id: string): Promise<TripSnapshot> {
    return this.apply(id, (trip) => trip.finish());
  }

  cancel(id: string): Promise<TripSnapshot> {
    return this.apply(id, (trip) => trip.cancel());
  }

  async get(id: string): Promise<TripSnapshot> {
    return (await this.load(id)).toSnapshot();
  }

  // ponytail: load -> transiciona -> save sem trava. Duas requests simultaneas
  // (ex.: accept e cancel na mesma corrida) podem ler o mesmo estado e a ultima
  // escrita vence. Concorrencia e assunto da Etapa 4 (lock / versao otimista).
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
