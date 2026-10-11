/** Metros por grau de latitude (quase constante na Terra inteira). */
const METERS_PER_DEGREE = 111_320;

export interface Point {
  lat: number;
  lng: number;
}

/** Retangulo do mapa onde a frota anda. */
export interface Area {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Um grau de longitude encolhe longe do equador (os meridianos se juntam nos polos):
 * vale 111 km no equador e ~102 km em Sao Paulo. Por isso o cos(lat). Aproximacao
 * plana: boa para distancias de poucos km, que e o caso de uma cidade.
 */
function metersPerDegreeLng(lat: number): number {
  return METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180);
}

/** Quadrado de lado 2*halfSize metros em volta de um ponto. */
export function areaAround(center: Point, halfSizeMeters: number): Area {
  const dLat = halfSizeMeters / METERS_PER_DEGREE;
  const dLng = halfSizeMeters / metersPerDegreeLng(center.lat);
  return { minLat: center.lat - dLat, maxLat: center.lat + dLat, minLng: center.lng - dLng, maxLng: center.lng + dLng };
}

/** Anda `meters` na direcao `headingDeg` (0 = norte, 90 = leste). */
export function move(from: Point, headingDeg: number, meters: number): Point {
  const heading = (headingDeg * Math.PI) / 180;
  return {
    lat: from.lat + (Math.cos(heading) * meters) / METERS_PER_DEGREE,
    lng: from.lng + (Math.sin(heading) * meters) / metersPerDegreeLng(from.lat),
  };
}

export function contains(area: Area, p: Point): boolean {
  return p.lat >= area.minLat && p.lat <= area.maxLat && p.lng >= area.minLng && p.lng <= area.maxLng;
}

/** Distancia aproximada em metros (mesma aproximacao plana do `move`). */
export function distanceMeters(a: Point, b: Point): number {
  const dy = (b.lat - a.lat) * METERS_PER_DEGREE;
  const dx = (b.lng - a.lng) * metersPerDegreeLng((a.lat + b.lat) / 2);
  return Math.hypot(dx, dy);
}
