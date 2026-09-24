import { Module } from '@nestjs/common';
import { TripController } from './http/trip.controller';

@Module({
  controllers: [TripController],
  providers: [
    // TODO(dominio): use cases, a maquina de estados da corrida, matching burro
    // (in-memory, sincrono) e a impl do repositorio.
  ],
})
export class TripModule {}
