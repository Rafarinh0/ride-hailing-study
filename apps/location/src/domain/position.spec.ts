import { describe, expect, it } from 'vitest';
import { InvalidPositionError } from './errors';
import { distanceMeters, driverPosition, MAX_CLOCK_SKEW_MS, Position } from './position';

describe('Position', () => {
  it('aceita os limites', () => {
    expect(Position.create(-90, 180)).toMatchObject({ lat: -90, lng: 180 });
  });

  it.each([
    [90.0001, 0],
    [0, -180.0001],
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
  ])('rejeita (%s, %s)', (lat, lng) => {
    expect(() => Position.create(lat, lng)).toThrow(InvalidPositionError);
  });
});

describe('distanceMeters', () => {
  it('1 grau de latitude vale ~111,2 km', () => {
    expect(distanceMeters(Position.create(0, 0), Position.create(1, 0))).toBeCloseTo(111_226, 0);
  });

  it('um grau de longitude encolhe longe do equador', () => {
    const atSaoPaulo = distanceMeters(Position.create(-23.55, -46.63), Position.create(-23.55, -45.63));
    expect(atSaoPaulo).toBeGreaterThan(101_000);
    expect(atSaoPaulo).toBeLessThan(102_500);
  });
});

describe('driverPosition', () => {
  const now = new Date('2026-01-01T12:00:00Z');
  const base = { driverId: 'd1', lat: -23.55, lng: -46.63 };

  it('aceita leitura do passado e dentro da tolerancia de relogio', () => {
    expect(driverPosition({ ...base, recordedAt: new Date(now.getTime() - 5_000) }, now).position.lat).toBe(-23.55);
    expect(() => driverPosition({ ...base, recordedAt: new Date(now.getTime() + MAX_CLOCK_SKEW_MS) }, now)).not.toThrow();
  });

  it('rejeita leitura alem da tolerancia no futuro', () => {
    const future = new Date(now.getTime() + MAX_CLOCK_SKEW_MS + 1);
    expect(() => driverPosition({ ...base, recordedAt: future }, now)).toThrow(InvalidPositionError);
  });
});
