import { Trip } from '../trip';

/**
 * Porta de persistencia da corrida. `save` cria OU atualiza (upsert): o use case
 * nao precisa saber se a corrida e nova, so que o estado atual deve ser gravado.
 */
export interface TripRepository {
  save(trip: Trip): Promise<void>;
  findById(id: string): Promise<Trip | null>;
}

export const TRIP_REPOSITORY = Symbol('TRIP_REPOSITORY');
