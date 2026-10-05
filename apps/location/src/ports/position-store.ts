import { DriverPosition } from '../domain/position';

/**
 * Onde fica a posicao atual de cada motorista. Porta porque a troca ja esta no
 * roteiro: Postgres agora, Redis GEO depois de medir (Milestone 4).
 */
export interface PositionStore {
  /**
   * Grava se a leitura for mais nova que a guardada. Leitura atrasada (chegou depois
   * de uma mais recente) e ignorada. Devolve se gravou.
   */
  save(reading: DriverPosition): Promise<boolean>;
  find(driverId: string): Promise<DriverPosition | null>;
}
