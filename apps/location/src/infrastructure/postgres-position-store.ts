import { eq, sql } from 'drizzle-orm';
import { DriverPosition, Position } from '../domain/position';
import { PositionStore } from '../ports/position-store';
import { Database } from './database';
import { driverPositions } from './schema';

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
}
