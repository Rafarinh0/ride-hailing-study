import { describe, expect, it } from 'vitest';
import { InvalidPositionError } from './errors';
import { driverPosition, MAX_CLOCK_SKEW_MS, Position } from './position';

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
