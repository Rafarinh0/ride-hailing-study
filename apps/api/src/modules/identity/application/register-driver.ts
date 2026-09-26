import { Inject, Injectable } from '@nestjs/common';
import { Driver } from '../domain/driver';
import { EmailAlreadyInUseError } from '../domain/errors';
import { DRIVER_REPOSITORY, DriverRepository } from '../domain/ports/driver.repository';
import { Email } from '../domain/value-objects/email';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';

/** Mesmo fluxo do RegisterRider (ver comentario TOCTOU la), para o papel motorista. */
@Injectable()
export class RegisterDriver {
  constructor(
    @Inject(DRIVER_REPOSITORY) private readonly drivers: DriverRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { name: string; email: string; password: string }): Promise<{ id: string }> {
    const email = Email.create(input.email);

    if (await this.drivers.findByEmail(email)) {
      throw new EmailAlreadyInUseError(email.value);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const driver = Driver.register({ name: input.name, email, passwordHash });

    await this.drivers.save(driver);
    return { id: driver.id };
  }
}
