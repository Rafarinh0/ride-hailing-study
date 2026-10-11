import { Area, contains, move, Point } from './geo';
import { Rng, uuidFrom } from './random';

/** Quanto o motorista pode virar por passo, para cada lado. Rua nao e linha reta. */
const MAX_TURN_DEG = 30;

export interface SimDriver extends Point {
  readonly id: string;
  readonly headingDeg: number;
  readonly speedMps: number;
}

export function createFleet(size: number, area: Area, speedMps: number, rng: Rng): SimDriver[] {
  return Array.from({ length: size }, () => ({
    id: uuidFrom(rng),
    lat: area.minLat + rng() * (area.maxLat - area.minLat),
    lng: area.minLng + rng() * (area.maxLng - area.minLng),
    headingDeg: rng() * 360,
    speedMps,
  }));
}

/**
 * Um passo de `seconds`: vira um pouco (passeio aleatorio) e anda. Se sairia da
 * area, rebate como bola na parede: inverte a componente que bateu e fica no lugar.
 */
export function step(driver: SimDriver, seconds: number, area: Area, rng: Rng): SimDriver {
  let headingDeg = (driver.headingDeg + (rng() * 2 - 1) * MAX_TURN_DEG + 360) % 360;
  let next = move(driver, headingDeg, driver.speedMps * seconds);

  if (next.lat < area.minLat || next.lat > area.maxLat) {
    headingDeg = (180 - headingDeg + 360) % 360; // inverte norte/sul
    next = { lat: driver.lat, lng: next.lng };
  }
  if (next.lng < area.minLng || next.lng > area.maxLng) {
    headingDeg = (360 - headingDeg) % 360; // inverte leste/oeste
    next = { lat: next.lat, lng: driver.lng };
  }
  if (!contains(area, next)) {
    next = { lat: driver.lat, lng: driver.lng };
  }
  return { ...driver, ...next, headingDeg };
}
