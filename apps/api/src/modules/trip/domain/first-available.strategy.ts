import { MatchingStrategy } from './matching-strategy';

/**
 * O matching "burro" do roteiro: o primeiro da fila, ou seja, quem esta livre ha
 * mais tempo. Ignora distancia de proposito — nao existe localizacao ainda.
 */
export class FirstAvailableStrategy implements MatchingStrategy {
  choose(availableDriverIds: readonly string[]): string | null {
    return availableDriverIds[0] ?? null;
  }
}
