import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../../database/drizzle.provider';
import { isUniqueViolation } from '../../../database/postgres-errors';
import { Driver } from '../domain/driver';
import { EmailAlreadyInUseError } from '../domain/errors';
import { DriverRepository } from '../domain/ports/driver.repository';
import { Email } from '../domain/value-objects/email';
import { drivers } from './schema';

/** Traducao Driver <-> linha de `drivers`. Mesmo desenho do DrizzleRiderRepository. */
@Injectable()
export class DrizzleDriverRepository implements DriverRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async save(driver: Driver): Promise<void> {
    try {
      await this.db.insert(drivers).values({
        id: driver.id,
        name: driver.name,
        email: driver.email.value,
        passwordHash: driver.passwordHash,
        createdAt: driver.createdAt,
      });
    } catch (error) {
      // Mesmo caso do DrizzleRiderRepository: cadastro simultaneo -> 409, nao 500.
      if (isUniqueViolation(error, 'drivers_email_unique')) {
        throw new EmailAlreadyInUseError(driver.email.value);
      }
      throw error;
    }
  }

  async findByEmail(email: Email): Promise<Driver | null> {
    const [row] = await this.db.select().from(drivers).where(eq(drivers.email, email.value)).limit(1);
    if (!row) {
      return null;
    }
    return Driver.rehydrate({
      id: row.id,
      name: row.name,
      email: Email.create(row.email),
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    });
  }
}
