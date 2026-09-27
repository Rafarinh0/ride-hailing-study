import { Module } from '@nestjs/common';
import { DRIVER_AVAILABILITY } from './application/ports/driver-availability';
import { TripUseCases } from './application/trip-use-cases';
import { FirstAvailableStrategy } from './domain/first-available.strategy';
import { MATCHING_STRATEGY } from './domain/matching-strategy';
import { TRIP_REPOSITORY } from './domain/ports/trip.repository';
import { DriversController } from './http/drivers.controller';
import { TripController } from './http/trip.controller';
import { DrizzleTripRepository } from './infrastructure/drizzle-trip.repository';
import { InMemoryDriverAvailability } from './infrastructure/in-memory-driver-availability';

/**
 * Trocar o algoritmo de matching e trocar a linha do MATCHING_STRATEGY; trocar a
 * memoria pelo Redis e trocar a linha do DRIVER_AVAILABILITY. Nada mais muda.
 * Decisoes registradas em docs/adr/0002-matching-em-memoria.md.
 *
 * Providers do Nest sao singletons: uma unica InMemoryDriverAvailability atende
 * todas as requisicoes, e e por isso que a lista em memoria funciona.
 */
@Module({
  controllers: [TripController, DriversController],
  providers: [
    TripUseCases,
    { provide: TRIP_REPOSITORY, useClass: DrizzleTripRepository },
    { provide: DRIVER_AVAILABILITY, useClass: InMemoryDriverAvailability },
    { provide: MATCHING_STRATEGY, useClass: FirstAvailableStrategy },
  ],
})
export class TripModule {}
