import { ConflictError, NotFoundError } from '../../../common/domain-error';
import { TripStatus } from './trip-status';

/**
 * Transicao ilegal e um CONFLITO com o estado atual (409), nao entrada invalida:
 * o mesmo pedido ("finalizar") seria valido se a corrida estivesse em outro estado.
 */
export class InvalidTripTransitionError extends ConflictError {
  constructor(from: TripStatus, to: TripStatus) {
    super(`transicao invalida: ${from} -> ${to}`);
  }
}

export class TripNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`corrida nao encontrada: ${id}`);
  }
}

/** Motorista em corrida nao pode ficar offline: primeiro termina a corrida. */
export class DriverBusyError extends ConflictError {
  constructor(driverId: string) {
    super(`motorista em corrida: ${driverId}`);
  }
}
