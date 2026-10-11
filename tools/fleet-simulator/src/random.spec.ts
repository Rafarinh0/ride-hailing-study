import { describe, expect, it } from 'vitest';
import { seededRng, uuidFrom } from './random';

describe('seededRng', () => {
  it('mesma semente, mesma sequencia; semente diferente, sequencia diferente', () => {
    const take = (seed: number) => Array.from({ length: 5 }, seededRng(seed));
    expect(take(42)).toEqual(take(42));
    expect(take(42)).not.toEqual(take(43));
  });

  it('fica em [0, 1)', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 10_000; i++) {
      const n = rng();
      expect(n >= 0 && n < 1).toBe(true);
    }
  });
});

describe('uuidFrom', () => {
  it('gera UUID v4 valido (o location recusa outro formato)', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 100; i++) {
      expect(uuidFrom(rng)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });
});
