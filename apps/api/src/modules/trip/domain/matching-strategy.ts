/**
 * Strategy: a REGRA de escolha do motorista, isolada atras de uma interface.
 * Quem pede a corrida nao sabe qual algoritmo esta em uso; trocar de algoritmo
 * e trocar a implementacao ligada no trip.module.ts.
 *
 * Hoje ha uma implementacao so (a primeira da fila). Uma interface com uma
 * implementacao costuma ser exagero; aqui ela existe porque a segunda ja esta no
 * roteiro: "o mais proximo", quando houver localizacao (Etapa 2).
 */
export interface MatchingStrategy {
  /** Recebe os motoristas livres em ordem de espera; devolve o escolhido ou null. */
  choose(availableDriverIds: readonly string[]): string | null;
}

export const MATCHING_STRATEGY = Symbol('MATCHING_STRATEGY');
