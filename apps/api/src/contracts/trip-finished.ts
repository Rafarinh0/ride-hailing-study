/**
 * Contrato do evento `trip.finished`: a "lingua" que trip e payment compartilham.
 * Mora fora dos dois modulos porque nao e dominio de nenhum deles (regra do
 * CLAUDE.md: o que e compartilhado so carrega contrato de evento). Na Etapa 3, quando
 * atravessar o Kafka, vira schema Zod versionado em packages/contracts.
 */
export const TRIP_FINISHED = 'trip.finished';

export interface TripFinishedEvent {
  readonly type: typeof TRIP_FINISHED;
  readonly tripId: string;
  readonly riderId: string;
  readonly driverId: string;
  readonly startedAt: Date;
  readonly finishedAt: Date;
}
