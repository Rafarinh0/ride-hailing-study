import { ConflictError, ValidationError } from '../../../common/domain-error';

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

export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: string) {
    super(`email ja em uso: ${email}`);
  }
}
