import { Money } from './value-objects/money';

export const BASE_FARE = Money.fromCents(500); // R$ 5,00
export const PER_MINUTE = Money.fromCents(50); // R$ 0,50

/**
 * Preco simulado: bandeirada + valor por minuto INICIADO (1min01s cobra 2 minutos),
 * com minimo de 1 minuto. Sem distancia porque ainda nao existe localizacao.
 *
 * ponytail: regra de preco dentro de payment. Quando existir preco dinamico, ela vira
 * modulo proprio (o `pricing` do CLAUDE.md) e o payment so recebe o valor.
 */
export function calculateFare(startedAt: Date, finishedAt: Date): Money {
  const minutes = Math.max(1, Math.ceil((finishedAt.getTime() - startedAt.getTime()) / 60_000));
  return BASE_FARE.plus(PER_MINUTE.times(minutes));
}
