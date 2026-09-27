import { describe, expect, it } from 'vitest';
import { calculateFare } from './fare';

const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, seconds));

describe('calculateFare', () => {
  it('corrida curta cobra o minimo de 1 minuto', () => {
    expect(calculateFare(at(0), at(10)).cents).toBe(550);
  });

  it('minuto iniciado conta inteiro', () => {
    expect(calculateFare(at(0), at(61)).cents).toBe(600); // 2 minutos
  });

  it('10 minutos exatos', () => {
    expect(calculateFare(at(0), at(600)).cents).toBe(1000);
  });
});
