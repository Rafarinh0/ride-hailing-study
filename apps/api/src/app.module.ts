import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './common/domain-exception.filter';
import { EventsModule } from './common/events/events.module';
import { DrizzleModule } from './database/drizzle.module';
import { IdentityModule } from './modules/identity/identity.module';
import { TripModule } from './modules/trip/trip.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [DrizzleModule, EventsModule, IdentityModule, TripModule, PaymentModule],
  providers: [
    // Filtro global: erro de dominio -> status HTTP, em um lugar so.
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
