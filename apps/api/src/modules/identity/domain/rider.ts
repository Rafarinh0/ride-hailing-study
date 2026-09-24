import { randomUUID } from 'node:crypto';
import { InvalidRiderError } from './errors';
import { Email } from './value-objects/email';

/**
 * Aggregate Rider (passageiro). E o guardiao das suas proprias invariantes:
 * ninguem monta um Rider em estado invalido.
 *
 * Note as DUAS fabricas:
 *  - register(): cria um rider NOVO. Aplica invariantes, gera id e createdAt.
 *  - rehydrate(): reconstroi um rider que JA existe (veio do banco). Nao revalida,
 *    porque o dado ja foi validado quando foi criado. So o repositorio chama isto.
 *
 * O aggregate guarda o hash da senha, nunca o texto puro — quem hasheia e o use
 * case (via porta PasswordHasher), antes de chamar register().
 */
export class Rider {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
  ) {}

  static register(input: { name: string; email: Email; passwordHash: string }): Rider {
    const name = input.name.trim();
    if (name.length === 0) {
      throw new InvalidRiderError('nome obrigatorio');
    }
    return new Rider(randomUUID(), name, input.email, input.passwordHash, new Date());
  }

  static rehydrate(props: {
    id: string;
    name: string;
    email: Email;
    passwordHash: string;
    createdAt: Date;
  }): Rider {
    return new Rider(props.id, props.name, props.email, props.passwordHash, props.createdAt);
  }
}
