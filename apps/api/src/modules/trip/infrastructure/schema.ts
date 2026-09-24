import { pgSchema } from 'drizzle-orm/pg-core';

// Namespace dedicado do modulo trip no Postgres unico.
export const tripSchema = pgSchema('trip');

// TODO(dominio): defina a tabela da corrida e o enum de estados
//   (solicitada, aceita, em_curso, finalizada, cancelada).
// A modelagem e sua. Ver CLAUDE.md.
