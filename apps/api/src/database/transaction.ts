import { AsyncLocalStorage } from 'node:async_hooks';
import { Inject, Injectable } from '@nestjs/common';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { UnitOfWork } from '../common/unit-of-work';
import { DRIZZLE, Database } from './drizzle.provider';
import type * as schema from './schema';

/** O que o banco e uma transacao aberta tem em comum: select, insert, update... */
export type Executor = PgDatabase<PostgresJsQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

/**
 * Guarda a transacao aberta da requisicao atual. AsyncLocalStorage e um "contexto
 * por fluxo assincrono": cada requisicao ve so a sua transacao, mesmo com varias
 * rodando intercaladas. Assim o repositorio acha a transacao sem ninguem passar
 * `tx` de mao em mao pelas camadas.
 */
const openTransaction = new AsyncLocalStorage<Executor>();

/** A transacao aberta, se houver; senao o banco direto. */
export function executorOf(root: Database): Executor {
  return openTransaction.getStore() ?? root;
}

/** Roda `work` numa transacao: entra na que ja estiver aberta, ou abre uma nova. */
export function inTransaction<T>(root: Database, work: (db: Executor) => Promise<T>): Promise<T> {
  const open = openTransaction.getStore();
  if (open) {
    return work(open);
  }
  return root.transaction((tx) => openTransaction.run(tx, () => work(tx)));
}

@Injectable()
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(@Inject(DRIZZLE) private readonly root: Database) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return inTransaction(this.root, () => work());
  }
}
