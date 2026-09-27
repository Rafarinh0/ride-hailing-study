import { Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { DriverPresence } from '../application/driver-presence';

/**
 * Motorista avisa se esta disponivel. 204: a acao nao devolve conteudo.
 * O id nao e conferido contra o modulo identity (mesmo caso do riderId na corrida):
 * validar sem acoplar os modulos exige porta ou evento, assunto da Milestone 4.
 */
@Controller('drivers')
export class DriversController {
  constructor(private readonly presence: DriverPresence) {}

  @Post(':id/online')
  @HttpCode(204)
  goOnline(@Param('id', ParseUUIDPipe) id: string) {
    return this.presence.goOnline(id);
  }

  @Post(':id/offline')
  @HttpCode(204)
  goOffline(@Param('id', ParseUUIDPipe) id: string) {
    return this.presence.goOffline(id);
  }
}
