import { Charge } from '../charge';

export interface ChargeRepository {
  /**
   * Grava a cobranca e seus lancamentos, tudo ou nada. Devolve false se a corrida
   * ja tinha cobranca (nao grava de novo): e o que torna o handler idempotente.
   */
  saveIfNew(charge: Charge): Promise<boolean>;
  findByTripId(tripId: string): Promise<Charge | null>;
}

export const CHARGE_REPOSITORY = Symbol('CHARGE_REPOSITORY');
