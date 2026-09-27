import { Inject, Injectable } from '@nestjs/common';
import { DRIVER_AVAILABILITY, DriverAvailability } from './ports/driver-availability';

/**
 * Motorista avisando que ficou online/offline. Hoje so repassa para a porta; existe
 * para o controller nao falar direto com a infraestrutura (regra das camadas).
 * Na Etapa 2, e aqui que entra a posicao do motorista junto com o "estou online".
 */
@Injectable()
export class DriverPresence {
  constructor(@Inject(DRIVER_AVAILABILITY) private readonly availability: DriverAvailability) {}

  goOnline(driverId: string): Promise<void> {
    return this.availability.goOnline(driverId);
  }

  goOffline(driverId: string): Promise<void> {
    return this.availability.goOffline(driverId);
  }
}
