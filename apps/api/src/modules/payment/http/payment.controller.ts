import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PaymentUseCases } from '../application/payment-use-cases';

/**
 * So leitura: ninguem cobra por HTTP, a cobranca nasce do evento trip.finished.
 * GET /payments/trips/:tripId mostra a cobranca e os lancamentos no ledger.
 */
@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentUseCases) {}

  @Get('trips/:tripId')
  chargeOf(@Param('tripId', ParseUUIDPipe) tripId: string) {
    return this.payments.chargeOf(tripId);
  }
}
