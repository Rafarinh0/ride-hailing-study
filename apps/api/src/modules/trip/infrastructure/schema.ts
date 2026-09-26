import { pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';
import { TRIP_STATUSES } from '../domain/trip-status';

// Namespace dedicado do modulo trip no Postgres unico.
export const tripSchema = pgSchema('trip');

/**
 * Enum no banco derivado da MESMA tupla do dominio. O Postgres recusa um status
 * fora da lista, mesmo que alguem escreva direto no banco sem passar pelo codigo.
 */
export const tripStatus = tripSchema.enum('trip_status', TRIP_STATUSES);

const at = (name: string) => timestamp(name, { withTimezone: true });

export const trips = tripSchema.table('trips', {
  id: uuid('id').primaryKey(),
  // Referencias por id a outro modulo (identity), SEM foreign key de proposito:
  // FK entre schemas acoplaria os modulos no banco e travaria a extracao do
  // servico mais tarde. A consistencia entre modulos vem por porta/evento.
  riderId: uuid('rider_id').notNull(),
  driverId: uuid('driver_id'),
  status: tripStatus('status').notNull(),
  requestedAt: at('requested_at').notNull(),
  acceptedAt: at('accepted_at'),
  startedAt: at('started_at'),
  finishedAt: at('finished_at'),
  cancelledAt: at('cancelled_at'),
});
