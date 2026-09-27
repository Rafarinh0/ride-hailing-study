import { Injectable } from '@nestjs/common';
import { DriverAvailability } from '../application/ports/driver-availability';
import { DriverBusyError } from '../domain/errors';

type Status = 'available' | 'busy';

/**
 * Disponibilidade em memoria. Um Map guarda a ordem de insercao, e essa ordem e
 * a fila de espera: quem entrou primeiro esta livre ha mais tempo.
 *
 * ponytail: memoria do processo. Some quando a API reinicia (motoristas precisam
 * ficar online de novo) e nao e compartilhada: com duas instancias da API, cada
 * uma teria sua lista e o mesmo motorista poderia ir para duas corridas.
 * Redis (Etapa 2) + lock distribuido (Etapa 4) resolvem.
 */
@Injectable()
export class InMemoryDriverAvailability implements DriverAvailability {
  private readonly drivers = new Map<string, Status>();

  async goOnline(driverId: string): Promise<void> {
    if (!this.drivers.has(driverId)) {
      this.drivers.set(driverId, 'available');
    }
  }

  async goOffline(driverId: string): Promise<void> {
    if (this.drivers.get(driverId) === 'busy') {
      throw new DriverBusyError(driverId);
    }
    this.drivers.delete(driverId);
  }

  async listAvailable(): Promise<string[]> {
    return [...this.drivers].filter(([, status]) => status === 'available').map(([id]) => id);
  }

  // Atomico porque nao ha nenhum `await` entre ler e escrever: o Node executa este
  // trecho inteiro sem que outra requisicao rode no meio.
  async claim(driverId: string): Promise<boolean> {
    if (this.drivers.get(driverId) !== 'available') {
      return false;
    }
    this.drivers.set(driverId, 'busy');
    return true;
  }

  async release(driverId: string): Promise<void> {
    if (this.drivers.get(driverId) === 'busy') {
      this.drivers.delete(driverId); // apaga e reinsere: vai para o fim da fila
      this.drivers.set(driverId, 'available');
    }
  }
}
