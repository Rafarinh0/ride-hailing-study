import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/errors';
import { DRIVER_REPOSITORY, DriverRepository } from '../domain/ports/driver.repository';
import { RIDER_REPOSITORY, RiderRepository } from '../domain/ports/rider.repository';
import { Email } from '../domain/value-objects/email';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';

export type AccountRole = 'rider' | 'driver';

/**
 * Login de passageiro ou motorista. Um use case so para os dois papeis: o fluxo
 * (achar por email, conferir senha) e identico, so muda de qual repositorio ler.
 *
 * Devolve so a identidade verificada ({ id, role }), sem token: nenhuma rota
 * consome usuario autenticado ainda. Quando consumir, um token assinado entra
 * aqui (ou num adapter) sem mexer no dominio.
 */
@Injectable()
export class Login {
  constructor(
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
    @Inject(DRIVER_REPOSITORY) private readonly drivers: DriverRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(
    role: AccountRole,
    input: { email: string; password: string },
  ): Promise<{ id: string; role: AccountRole }> {
    const email = Email.create(input.email);
    const account =
      role === 'rider' ? await this.riders.findByEmail(email) : await this.drivers.findByEmail(email);

    // Compara SEMPRE, mesmo sem conta (hash null): o tempo de resposta fica igual
    // nos dois casos e nao denuncia quais emails existem.
    const valid = await this.hasher.compare(input.password, account?.passwordHash ?? null);
    if (!account || !valid) {
      throw new InvalidCredentialsError();
    }

    return { id: account.id, role };
  }
}
