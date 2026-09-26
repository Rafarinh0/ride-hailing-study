import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../../database/drizzle.provider';
import { Driver } from '../domain/driver';
import { DriverRepository } from '../domain/ports/driver.repository';
import { Email } from '../domain/value-objects/email';
import { drivers } from './schema';

/** Traducao Driver <-> linha de `drivers`. Mesmo desenho do DrizzleRiderRepository. */
@Injectable()
export class DrizzleDriverRepository implements DriverRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async save(driver: Driver): Promise<void> {
    await this.db.insert(drivers).values({
      id: driver.id,
      name: driver.name,
      email: driver.email.value,
      passwordHash: driver.passwordHash,
      createdAt: driver.createdAt,
    });
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
