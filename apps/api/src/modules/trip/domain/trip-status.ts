/**
 * Estados da corrida (roteiro: solicitada, aceita, em curso, finalizada, cancelada).
 * `as const` transforma o array numa tupla literal: dela derivamos o tipo
 * TripStatus e o enum do Postgres (infrastructure/schema.ts) — uma fonte so.
 */
export const TRIP_STATUSES = ['requested', 'accepted', 'in_progress', 'finished', 'cancelled'] as const;

export type TripStatus = (typeof TRIP_STATUSES)[number];

/**
 * A maquina de estados INTEIRA, como dado: de cada estado, para onde pode ir.
 * Ler esta tabela e ler a regra de negocio. `Record<TripStatus, ...>` obriga a
 * declarar todos os estados: criar um estado novo e esquecer dele aqui nao compila.
 *
 * finished e cancelled nao tem saida: sao estados terminais.
 */
export const TRIP_TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
  requested: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['finished'], // em curso nao cancela: encerrar com cobranca e outro fluxo
  finished: [],
  cancelled: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return TRIP_TRANSITIONS[from].includes(to);
}
