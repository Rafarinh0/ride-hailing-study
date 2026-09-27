import { Module } from '@nestjs/common';
import { PaymentUseCases } from './application/payment-use-cases';
import { CHARGE_REPOSITORY } from './domain/ports/charge.repository';
import { PaymentController } from './http/payment.controller';
import { DrizzleChargeRepository } from './infrastructure/drizzle-charge.repository';

@Module({
  controllers: [PaymentController],
  providers: [PaymentUseCases, { provide: CHARGE_REPOSITORY, useClass: DrizzleChargeRepository }],
})
export class PaymentModule {}
