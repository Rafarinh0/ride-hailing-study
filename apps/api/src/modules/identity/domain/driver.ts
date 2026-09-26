import { randomUUID } from 'node:crypto';
import { InvalidDriverError } from './errors';
import { Email } from './value-objects/email';

/**
 * Aggregate Driver (motorista). Hoje tem a mesma forma do Rider, e isso e
 * proposital: sao papeis diferentes no dominio, que vao divergir (disponibilidade
 * para o matching na Milestone 3, depois veiculo e localizacao). Unificar os dois
 * num "Account" agora criaria uma abstracao que teria de ser desfeita depois.
 */
export class Driver {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
  ) {}

  static register(input: { name: string; email: Email; passwordHash: string }): Driver {
    const name = input.name.trim();
    if (name.length === 0) {
      throw new InvalidDriverError('nome obrigatorio');
    }
    return new Driver(randomUUID(), name, input.email, input.passwordHash, new Date());
  }

  static rehydrate(props: {
    id: string;
    name: string;
    email: Email;
    passwordHash: string;
    createdAt: Date;
  }): Driver {
    return new Driver(props.id, props.name, props.email, props.passwordHash, props.createdAt);
  }
}
