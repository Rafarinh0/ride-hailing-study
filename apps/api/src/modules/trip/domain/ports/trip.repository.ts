import { Trip } from '../trip';
import { TripStatus } from '../trip-status';

/**
 * Porta de persistencia da corrida. `save` cria OU atualiza (upsert): o use case
 * nao precisa saber se a corrida e nova, so que o estado atual deve ser gravado.
 */
export interface TripRepository {
  save(trip: Trip): Promise<void>;
  /**
   * Atualiza so se, no banco, a corrida ainda estiver em `expected` (o status lido
   * antes da transicao). Devolve false se outra requisicao mudou antes.
   */
  saveIfStatus(trip: Trip, expected: TripStatus): Promise<boolean>;
  findById(id: string): Promise<Trip | null>;
}

export const TRIP_REPOSITORY = Symbol('TRIP_REPOSITORY');
