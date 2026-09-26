import { ConflictError, UnauthorizedError, ValidationError } from '../../../common/domain-error';

export class InvalidEmailError extends ValidationError {
  constructor(raw: string) {
    super(`email invalido: "${raw}"`);
  }
}

export class InvalidRiderError extends ValidationError {
  constructor(reason: string) {
    super(`rider invalido: ${reason}`);
  }
}

export class InvalidDriverError extends ValidationError {
  constructor(reason: string) {
    super(`driver invalido: ${reason}`);
  }
}

export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: string) {
    super(`email ja em uso: ${email}`);
  }
}

/**
 * Mesma mensagem para "email nao existe" e "senha errada", de proposito: dizer
 * qual dos dois falhou entrega a um atacante a lista de emails cadastrados.
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('credenciais invalidas');
  }
}
