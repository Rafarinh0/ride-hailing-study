import { NotFoundError, ValidationError } from '../../../common/domain-error';

export class InvalidMoneyError extends ValidationError {
  constructor(cents: number) {
    super(`valor invalido: ${cents} centavos (precisa ser inteiro e nao negativo)`);
  }
}

export class ChargeNotFoundError extends NotFoundError {
  constructor(tripId: string) {
    super(`cobranca nao encontrada para a corrida ${tripId}`);
  }
}
