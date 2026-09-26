import { Module } from '@nestjs/common';
import { TripUseCases } from './application/trip-use-cases';
import { TRIP_REPOSITORY } from './domain/ports/trip.repository';
import { TripController } from './http/trip.controller';
import { DrizzleTripRepository } from './infrastructure/drizzle-trip.repository';

@Module({
  controllers: [TripController],
  providers: [TripUseCases, { provide: TRIP_REPOSITORY, useClass: DrizzleTripRepository }],
})
export class TripModule {}
