import { InvalidPositionError } from './errors';

/** Value Object: um ponto na Terra. So existe se a latitude e a longitude forem possiveis. */
export class Position {
  private constructor(
    public readonly lat: number,
    public readonly lng: number,
  ) {}

  static create(lat: number, lng: number): Position {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new InvalidPositionError(`latitude fora de [-90, 90]: ${lat}`);
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new InvalidPositionError(`longitude fora de [-180, 180]: ${lng}`);
    }
    return new Position(lat, lng);
  }
}

/** Mesmo raio da Terra que o Redis GEO usa: as duas implementacoes medem igual. */
export const EARTH_RADIUS_M = 6372797.560856;

/** Distancia pela superficie da esfera (formula de haversine), em metros. */
export function distanceMeters(a: Position, b: Position): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Tolerancia para relogio adiantado no celular. Sem limite, uma leitura com data no
 * futuro viraria a "mais nova" para sempre e congelaria a posicao do motorista: toda
 * leitura real chegaria "mais velha" que ela e seria ignorada.
 */
export const MAX_CLOCK_SKEW_MS = 30_000;

/** Onde um motorista estava, e QUANDO o GPS leu isso (nao quando chegou ao servidor). */
export interface DriverPosition {
  readonly driverId: string;
  readonly position: Position;
  readonly recordedAt: Date;
}

/** Resultado da busca por proximidade: a leitura e a distancia ate o ponto buscado. */
export interface NearbyDriver extends DriverPosition {
  readonly distanceMeters: number;
}

export function driverPosition(
  input: { driverId: string; lat: number; lng: number; recordedAt: Date },
  now: Date,
): DriverPosition {
  if (input.recordedAt.getTime() > now.getTime() + MAX_CLOCK_SKEW_MS) {
    throw new InvalidPositionError(`leitura no futuro: ${input.recordedAt.toISOString()}`);
  }
  return {
    driverId: input.driverId,
    position: Position.create(input.lat, input.lng),
    recordedAt: input.recordedAt,
  };
}
