import { Injectable } from '@nestjs/common';
import { DriverAvailability } from '../application/ports/driver-availability';
import { DriverBusyError } from '../domain/errors';

/**
 * Disponibilidade em memoria, em duas estruturas:
 *  - `available`: so os livres. Um Set guarda a ordem de insercao, e essa ordem e a
 *    fila de espera. Listar custa o numero de LIVRES, nao o total de motoristas.
 *  - `busy`: motorista -> corrida com que ele esta. Liberar confere a corrida.
 *
 * ponytail: memoria do processo. Some quando a API reinicia (motoristas precisam
 * ficar online de novo) e nao e compartilhada: com duas instancias da API, cada
 * uma teria sua lista e o mesmo motorista poderia ir para duas corridas.
 * Redis (Etapa 2) + lock distribuido (Etapa 4) resolvem.
 */
@Injectable()
export class InMemoryDriverAvailability implements DriverAvailability {
  private readonly available = new Set<string>();
  private readonly busy = new Map<string, string>();

  async goOnline(driverId: string): Promise<void> {
    if (!this.busy.has(driverId)) {
      this.available.add(driverId);
    }
  }

  async goOffline(driverId: string): Promise<void> {
    if (this.busy.has(driverId)) {
      throw new DriverBusyError(driverId);
    }
    this.available.delete(driverId);
  }

  async listAvailable(): Promise<string[]> {
    return [...this.available];
  }

  // Atomico porque nao ha nenhum `await` entre ler e escrever: o Node executa este
  // trecho inteiro sem que outra requisicao rode no meio.
  async claim(driverId: string, tripId: string): Promise<boolean> {
    if (!this.available.delete(driverId)) {
      return false;
    }
    this.busy.set(driverId, tripId);
    return true;
  }

  async release(driverId: string, tripId: string): Promise<void> {
    if (this.busy.get(driverId) !== tripId) {
      return;
    }
    this.busy.delete(driverId);
    this.available.add(driverId); // entra no fim da fila
  }
}
