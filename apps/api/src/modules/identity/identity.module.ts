import { Module } from '@nestjs/common';
import { RegisterRider } from './application/register-rider';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { RIDER_REPOSITORY } from './domain/ports/rider.repository';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { DrizzleRiderRepository } from './infrastructure/drizzle-rider.repository';
import { IdentityController } from './http/identity.controller';

/**
 * Aqui o DIP e AMARRADO: cada token de porta -> a implementacao concreta. Trocar
 * de Drizzle pra outra coisa, ou de bcrypt pra argon2, e mudar so uma linha aqui.
 * O use case e o dominio nao mudam.
 */
@Module({
  controllers: [IdentityController],
  providers: [
    RegisterRider,
    { provide: RIDER_REPOSITORY, useClass: DrizzleRiderRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
  ],
})
export class IdentityModule {}
