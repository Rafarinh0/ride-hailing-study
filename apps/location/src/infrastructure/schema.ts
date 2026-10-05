import { doublePrecision, pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';

// Schema do servico location. So este servico le e escreve aqui.
export const locationSchema = pgSchema('location');

/**
 * Uma linha por motorista: a posicao ATUAL, sobrescrita a cada leitura. Historico
 * (rota da corrida) e outra necessidade e ficaria noutra tabela.
 * driver_id sem FK: o motorista e do identity, outro servico.
 */
export const driverPositions = locationSchema.table('driver_positions', {
  driverId: uuid('driver_id').primaryKey(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
});
