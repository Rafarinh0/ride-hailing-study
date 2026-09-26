import { randomUUID } from 'node:crypto';
import { InvalidTripTransitionError } from './errors';
import { canTransition, TripStatus } from './trip-status';

/**
 * Foto do estado da corrida. As chaves espelham as colunas da tabela de proposito:
 * o repositorio persiste o snapshot e reconstroi a partir dele, sem precisar
 * enxergar o estado privado do aggregate.
 */
export interface TripSnapshot {
  id: string;
  riderId: string;
  driverId: string | null;
  status: TripStatus;
  requestedAt: Date;
  acceptedAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  cancelledAt: Date | null;
}

/**
 * Aggregate Corrida. Diferente do Rider (que nasce e nao muda), a corrida tem
 * CICLO DE VIDA. Por isso o estado e privado e so muda por metodos que revelam
 * intencao (accept, start, finish, cancel), nunca por setter. Quem tem uma Trip
 * na mao nao consegue colocar ela num estado que a maquina nao permite.
 *
 * riderId/driverId sao so ids: o modulo trip nao importa o dominio de identity.
 */
export class Trip {
  private constructor(private readonly props: TripSnapshot) {}

  static request(riderId: string): Trip {
    return new Trip({
      id: randomUUID(),
      riderId,
      driverId: null,
      status: 'requested',
      requestedAt: new Date(),
      acceptedAt: null,
      startedAt: null,
      finishedAt: null,
      cancelledAt: null,
    });
  }

  /** Reconstroi a partir do banco. Copia o snapshot pra ninguem alterar por fora. */
  static rehydrate(snapshot: TripSnapshot): Trip {
    return new Trip({ ...snapshot });
  }

  get id(): string {
    return this.props.id;
  }

  get riderId(): string {
    return this.props.riderId;
  }

  get driverId(): string | null {
    return this.props.driverId;
  }

  get status(): TripStatus {
    return this.props.status;
  }

  accept(driverId: string): void {
    this.transitionTo('accepted');
    this.props.driverId = driverId;
    this.props.acceptedAt = new Date();
  }

  start(): void {
    this.transitionTo('in_progress');
    this.props.startedAt = new Date();
  }

  finish(): void {
    this.transitionTo('finished');
    this.props.finishedAt = new Date();
  }

  cancel(): void {
    this.transitionTo('cancelled');
    this.props.cancelledAt = new Date();
  }

  toSnapshot(): TripSnapshot {
    return { ...this.props };
  }

  /**
   * O guarda unico da maquina. Valida ANTES de mudar qualquer coisa: se a
   * transicao e ilegal, lanca e a corrida continua exatamente como estava.
   */
  private transitionTo(next: TripStatus): void {
    if (!canTransition(this.props.status, next)) {
      throw new InvalidTripTransitionError(this.props.status, next);
    }
    this.props.status = next;
  }
}
