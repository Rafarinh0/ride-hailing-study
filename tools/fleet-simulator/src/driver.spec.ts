import { describe, expect, it } from 'vitest';
import { createFleet, step } from './driver';
import { areaAround, contains, distanceMeters } from './geo';
import { seededRng } from './random';

const area = areaAround({ lat: -23.5505, lng: -46.6333 }, 5_000);
const SPEED = 30 / 3.6; // 30 km/h em m/s

describe('frota', () => {
  it('mesma semente gera a mesma frota', () => {
    expect(createFleet(10, area, SPEED, seededRng(42))).toEqual(createFleet(10, area, SPEED, seededRng(42)));
  });

  it('ninguem sai da area, mesmo depois de muitos passos', () => {
    const rng = seededRng(3);
    let fleet = createFleet(50, area, SPEED, rng);
    for (let i = 0; i < 2_000; i++) {
      fleet = fleet.map((d) => step(d, 2, area, rng));
    }
    expect(fleet.every((d) => contains(area, d))).toBe(true);
  });

  it('cada passo anda no maximo velocidade x tempo (sem teletransporte)', () => {
    const rng = seededRng(5);
    let driver = createFleet(1, area, SPEED, rng)[0];
    for (let i = 0; i < 500; i++) {
      const next = step(driver, 2, area, rng);
      expect(distanceMeters(driver, next)).toBeLessThanOrEqual(SPEED * 2 + 0.01);
      driver = next;
    }
  });

  it('longe da borda, anda exatamente velocidade x tempo', () => {
    const center = { id: 'd', lat: -23.5505, lng: -46.6333, headingDeg: 0, speedMps: SPEED };
    const next = step(center, 2, area, seededRng(9));
    expect(distanceMeters(center, next)).toBeCloseTo(SPEED * 2, 1);
  });
});
