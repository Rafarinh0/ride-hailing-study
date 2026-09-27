import { integer, pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';
import { LEDGER_ACCOUNTS } from '../domain/charge';

// Namespace dedicado do modulo payment no Postgres unico.
export const paymentSchema = pgSchema('payment');

/**
 * Uma cobranca por corrida: o UNIQUE em trip_id garante que o mesmo evento
 * `trip.finished` entregue duas vezes nao cobre duas vezes. trip_id/rider_id/
 * driver_id sem FK: sao de outros modulos (mesma regra da tabela trips).
 */
export const charges = paymentSchema.table('charges', {
  id: uuid('id').primaryKey(),
  tripId: uuid('trip_id').notNull().unique(),
  riderId: uuid('rider_id').notNull(),
  driverId: uuid('driver_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const ledgerAccount = paymentSchema.enum('ledger_account', LEDGER_ACCOUNTS);

/**
 * Livro-razao append-only: lancamentos so sao inseridos, nunca editados. Aqui a FK
 * existe, porque cobranca e lancamento sao do MESMO modulo (e do mesmo aggregate).
 */
export const ledgerEntries = paymentSchema.table('ledger_entries', {
  id: uuid('id').primaryKey(),
  chargeId: uuid('charge_id')
    .notNull()
    .references(() => charges.id),
  account: ledgerAccount('account').notNull(),
  accountId: uuid('account_id'),
  amountCents: integer('amount_cents').notNull(),
});
