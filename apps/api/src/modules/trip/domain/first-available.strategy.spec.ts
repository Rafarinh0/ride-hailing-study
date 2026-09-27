import { describe, expect, it } from 'vitest';
import { FirstAvailableStrategy } from './first-available.strategy';

describe('FirstAvailableStrategy', () => {
  const strategy = new FirstAvailableStrategy();

  it('escolhe quem esta esperando ha mais tempo (o primeiro da fila)', () => {
    expect(strategy.choose(['d1', 'd2', 'd3'])).toBe('d1');
  });

  it('sem motorista livre, devolve null', () => {
    expect(strategy.choose([])).toBeNull();
  });
});
