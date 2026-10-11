import { eq, sql } from 'drizzle-orm';
import { DriverPosition, EARTH_RADIUS_M, NearbyDriver, Position } from '../domain/position';
import { PositionStore } from '../ports/position-store';
import { Database } from './database';
import { driverPositions } from './schema';

const METERS_PER_DEGREE = (EARTH_RADIUS_M * Math.PI) / 180;

/** Retangulo que contem o circulo de raio `radius` em volta de `center`. */
function boundingBox(center: Position, radius: number) {
  const dLat = radius / METERS_PER_DEGREE;
  const dLng = dLat / Math.cos((center.lat * Math.PI) / 180);
  return { minLat: center.lat - dLat, maxLat: center.lat + dLat, minLng: center.lng - dLng, maxLng: center.lng + dLng };
}

export class PostgresPositionStore implements PositionStore {
  constructor(private readonly db: Database) {}

  /**
   * Upsert com guarda de ordem, num comando so: insere a primeira leitura; nas
   * seguintes, so atualiza se a nova for mais recente. Sem o WHERE, uma leitura
   * atrasada na rede jogaria o motorista de volta para onde ele estava antes.
   */
  async save(reading: DriverPosition): Promise<boolean> {
    const values = {
      lat: reading.position.lat,
      lng: reading.position.lng,
      recordedAt: reading.recordedAt,
    };
    const written = await this.db
      .insert(driverPositions)
      .values({ driverId: reading.driverId, ...values })
      .onConflictDoUpdate({
        target: driverPositions.driverId,
        set: values,
        setWhere: sql`${driverPositions.recordedAt} < excluded.recorded_at`,
      })
      .returning({ driverId: driverPositions.driverId });
    return written.length === 1;
  }

  async find(driverId: string): Promise<DriverPosition | null> {
    const [row] = await this.db.select().from(driverPositions).where(eq(driverPositions.driverId, driverId)).limit(1);
    if (!row) {
      return null;
    }
    return { driverId: row.driverId, position: Position.create(row.lat, row.lng), recordedAt: row.recordedAt };
  }

  /**
   * Em duas etapas: (1) o indice GiST acha quem esta no retangulo em volta do circulo;
   * (2) so para esses candidatos calcula a distancia exata (haversine, mesmo raio da
   * Terra do Redis), descarta os cantos do retangulo e ordena.
   * Os ::float8 dizem ao Postgres o tipo dos parametros, que chegam sem tipo.
   */
  async findNearby(center: Position, radiusMeters: number, limit: number): Promise<NearbyDriver[]> {
    const box = boundingBox(center, radiusMeters);
    const rows = await this.db.execute<{ driver_id: string; lat: number; lng: number; recorded_at: Date; distance: number }>(sql`
      select driver_id, lat, lng, recorded_at, distance from (
        select driver_id, lat, lng, recorded_at,
          2 * ${EARTH_RADIUS_M}::float8 * asin(sqrt(
            power(sin(radians(lat - ${center.lat}::float8) / 2), 2) +
            cos(radians(${center.lat}::float8)) * cos(radians(lat)) * power(sin(radians(lng - ${center.lng}::float8) / 2), 2)
          )) as distance
        from ${driverPositions}
        where point(lng, lat) <@ box(point(${box.minLng}::float8, ${box.minLat}::float8), point(${box.maxLng}::float8, ${box.maxLat}::float8))
      ) candidates
      where distance <= ${radiusMeters}::float8
      order by distance
      limit ${limit}
    `);
    return rows.map((r) => ({
      driverId: r.driver_id,
      position: Position.create(r.lat, r.lng),
      recordedAt: new Date(r.recorded_at),
      distanceMeters: r.distance,
    }));
  }
}
