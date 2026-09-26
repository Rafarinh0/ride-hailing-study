import { Module } from '@nestjs/common';
import { Login } from './application/login';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { RegisterDriver } from './application/register-driver';
import { RegisterRider } from './application/register-rider';
import { DRIVER_REPOSITORY } from './domain/ports/driver.repository';
import { RIDER_REPOSITORY } from './domain/ports/rider.repository';
import { IdentityController } from './http/identity.controller';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { DrizzleDriverRepository } from './infrastructure/drizzle-driver.repository';
import { DrizzleRiderRepository } from './infrastructure/drizzle-rider.repository';

/**
 * Aqui o DIP e AMARRADO: cada token de porta -> a implementacao concreta. Trocar
 * de Drizzle pra outra coisa, ou de bcrypt pra argon2, e mudar so uma linha aqui.
 * O use case e o dominio nao mudam.
 */
@Module({
  controllers: [IdentityController],
  providers: [
    RegisterRider,
    RegisterDriver,
    Login,
    { provide: RIDER_REPOSITORY, useClass: DrizzleRiderRepository },
    { provide: DRIVER_REPOSITORY, useClass: DrizzleDriverRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  ],
})
export class IdentityModule {}
