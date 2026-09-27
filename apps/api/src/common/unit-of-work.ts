/**
 * Porta para "tudo isto numa transacao so". A camada de aplicacao demarca ONDE a
 * transacao comeca e termina, sem saber que existe Drizzle ou Postgres por baixo.
 * Repositorios chamados dentro de `run` participam da mesma transacao.
 */
export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
