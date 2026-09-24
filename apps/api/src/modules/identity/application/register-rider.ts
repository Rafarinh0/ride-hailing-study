import { Inject, Injectable } from '@nestjs/common';
import { EmailAlreadyInUseError } from '../domain/errors';
import { RIDER_REPOSITORY, RiderRepository } from '../domain/ports/rider.repository';
import { Rider } from '../domain/rider';
import { Email } from '../domain/value-objects/email';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';

/**
 * Use case: cadastrar um passageiro. A camada de aplicacao ORQUESTRA os passos —
 * ela nao contem regra de negocio pura (essa mora no VO Email e no aggregate
 * Rider). Aqui: valida email (VO), checa unicidade, hasheia, monta o aggregate,
 * persiste.
 *
 * Depende das PORTAS (interfaces), nunca das implementacoes concretas. O Nest
 * injeta as impls pelos tokens no identity.module.ts.
 */
@Injectable()
export class RegisterRider {
  constructor(
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { name: string; email: string; password: string }): Promise<{ id: string }> {
    const email = Email.create(input.email); // lanca InvalidEmailError se ruim

    // Checagem amigavel pra devolver 409 com mensagem clara. NAO e a garantia
    // real de unicidade: entre este SELECT e o INSERT, outra request pode inserir
    // (TOCTOU). A garantia de verdade e o UNIQUE na coluna email (ver schema.ts).
    // ponytail: check-then-insert; o UNIQUE do banco e a rede de seguranca.
    const existing = await this.riders.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyInUseError(email.value);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const rider = Rider.register({ name: input.name, email, passwordHash });

    await this.riders.save(rider);
    return { id: rider.id };
  }
}
