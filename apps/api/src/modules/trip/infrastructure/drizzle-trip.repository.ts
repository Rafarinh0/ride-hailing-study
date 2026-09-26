import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../../database/drizzle.provider';
import { TripRepository } from '../domain/ports/trip.repository';
import { Trip } from '../domain/trip';
import { trips } from './schema';

/**
 * Como o snapshot espelha as colunas, a traducao aggregate <-> linha e direta.
 * O repositorio nunca toca no estado privado da Trip: usa toSnapshot/rehydrate.
 */
@Injectable()
export class DrizzleTripRepository implements TripRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async save(trip: Trip): Promise<void> {
    const { id, ...changes } = trip.toSnapshot();
    // Upsert: INSERT se a corrida e nova, UPDATE se o id ja existe.
    await this.db
      .insert(trips)
      .values({ id, ...changes })
      .onConflictDoUpdate({ target: trips.id, set: changes });
  }

  async findById(id: string): Promise<Trip | null> {
    const [row] = await this.db.select().from(trips).where(eq(trips.id, id)).limit(1);
    return row ? Trip.rehydrate(row) : null;
  }
}
