import { DriverPosition, NearbyDriver, Position } from '../domain/position';

/**
 * Onde fica a posicao atual de cada motorista. Duas implementacoes (Postgres e
 * Redis) passam no mesmo teste de contrato: test/position-store.contract.ts.
 */
export interface PositionStore {
  /**
   * Grava se a leitura for mais nova que a guardada. Leitura atrasada (chegou depois
   * de uma mais recente) e ignorada. Devolve se gravou.
   */
  save(reading: DriverPosition): Promise<boolean>;
  find(driverId: string): Promise<DriverPosition | null>;
  /** Motoristas a ate `radiusMeters` de `center`, do mais perto ao mais longe, no maximo `limit`. */
  findNearby(center: Position, radiusMeters: number, limit: number): Promise<NearbyDriver[]>;
}
