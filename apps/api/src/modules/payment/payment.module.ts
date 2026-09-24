import { Module } from '@nestjs/common';
import { PaymentController } from './http/payment.controller';

@Module({
  controllers: [PaymentController],
  providers: [
    // TODO(dominio): cobranca simulada ao finalizar a corrida e o ledger.
  ],
})
export class PaymentModule {}
