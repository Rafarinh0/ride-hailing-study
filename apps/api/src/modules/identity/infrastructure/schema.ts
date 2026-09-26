import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Namespace dedicado do modulo identity no Postgres unico (schema por modulo).
export const identitySchema = pgSchema('identity');

/**
 * Tabela de passageiros. O UNIQUE em email e a garantia REAL de unicidade
 * (ver o comentario TOCTOU no register-rider.ts). Colunas em snake_case (padrao
 * SQL); no TS acessamos por camelCase (padrao JS) — o Drizzle faz a ponte.
 */
export const riders = identitySchema.table('riders', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Motoristas em tabela propria, nao uma coluna `role` em riders: os dois papeis
 * vao ganhar colunas diferentes. Consequencia: o mesmo email pode existir como
 * passageiro e como motorista (unicidade e por papel).
 */
export const drivers = identitySchema.table('drivers', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
