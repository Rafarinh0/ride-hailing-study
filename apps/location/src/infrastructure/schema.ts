import { sql } from 'drizzle-orm';
import { doublePrecision, index, pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';

// Schema do servico location. So este servico le e escreve aqui.
export const locationSchema = pgSchema('location');

/**
 * Uma linha por motorista: a posicao ATUAL, sobrescrita a cada leitura. Historico
 * (rota da corrida) e outra necessidade e ficaria noutra tabela.
 * driver_id sem FK: o motorista e do identity, outro servico.
 */
export const driverPositions = locationSchema.table(
  'driver_positions',
  {
    driverId: uuid('driver_id').primaryKey(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    // Indice GiST (2D, estilo R-tree) sobre o ponto: responde "quem esta dentro deste
    // retangulo" sem ler a tabela inteira. A consulta precisa usar a MESMA expressao,
    // point(lng, lat), para o Postgres reconhecer o indice.
    // Custo: lat/lng mudam a cada leitura, entao toda gravacao atualiza o indice.
    index('driver_positions_point_idx').using('gist', sql`point(${t.lng}, ${t.lat})`),
  ],
);
