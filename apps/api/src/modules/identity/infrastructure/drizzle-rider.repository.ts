import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../../database/drizzle.provider';
import { isUniqueViolation } from '../../../database/postgres-errors';
import { EmailAlreadyInUseError } from '../domain/errors';
import { RiderRepository } from '../domain/ports/rider.repository';
import { Rider } from '../domain/rider';
import { Email } from '../domain/value-objects/email';
import { riders } from './schema';

/**
 * Implementacao Drizzle da porta RiderRepository. E o UNICO lugar que conhece ao
 * mesmo tempo o aggregate (Rider) e a tabela (riders): ele TRADUZ entre os dois.
 * O dominio nunca ve `riders`; o banco nunca ve `Rider`.
 */
@Injectable()
export class DrizzleRiderRepository implements RiderRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async save(rider: Rider): Promise<void> {
    try {
      await this.db.insert(riders).values({
        id: rider.id,
        name: rider.name,
        email: rider.email.value, // VO -> string na fronteira do banco
        passwordHash: rider.passwordHash,
        createdAt: rider.createdAt,
      });
    } catch (error) {
      // Dois cadastros simultaneos passam juntos pelo findByEmail do use case; o
      // UNIQUE recusa o segundo. Traduzimos para o erro de dominio (409), senao o
      // cliente receberia 500.
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyInUseError(rider.email.value);
      }
      throw error;
    }
  }

  async findByEmail(email: Email): Promise<Rider | null> {
    const [row] = await this.db
      .select()
      .from(riders)
      .where(eq(riders.email, email.value))
      .limit(1);

    if (!row) {
      return null;
    }

    // rehydrate: string do banco -> VO. Dado guardado ja e valido, por isso
    // reconstruimos sem passar de novo pelas invariantes de register().
    return Rider.rehydrate({
      id: row.id,
      name: row.name,
      email: Email.create(row.email),
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    });
  }
}
