import { Controller } from '@nestjs/common';

/**
 * Borda HTTP do modulo payment: cobranca simulada e consulta ao ledger.
 * TODO(dominio): a regra de cobranca vive nos use cases / aggregate, nao aqui.
 */
@Controller('payments')
export class PaymentController {}
