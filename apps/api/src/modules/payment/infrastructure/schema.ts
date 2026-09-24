import { pgSchema } from 'drizzle-orm/pg-core';

// Namespace dedicado do modulo payment no Postgres unico.
export const paymentSchema = pgSchema('payment');

// TODO(dominio): defina a tabela de cobrancas e o ledger.
// O criterio de pronto da Etapa 1 e a cobranca aparecer no ledger. Ver CLAUDE.md.
