import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../../../database/drizzle.provider';
import { executorOf, inTransaction } from '../../../database/transaction';
import { Charge } from '../domain/charge';
import { ChargeRepository } from '../domain/ports/charge.repository';
import { charges, ledgerEntries } from './schema';

@Injectable()
export class DrizzleChargeRepository implements ChargeRepository {
  constructor(@Inject(DRIZZLE) private readonly root: Database) {}

  // Duas tabelas, um aggregate: grava tudo ou nada. Se ja houver transacao aberta
  // (o finish da corrida), entra nela; senao abre a propria.
  async saveIfNew(charge: Charge): Promise<boolean> {
    return inTransaction(this.root, async (db) => {
      // ON CONFLICT DO NOTHING em vez de "consulta, depois insere": nao tem janela
      // de corrida e nao aborta a transacao (um erro de UNIQUE abortaria).
      const inserted = await db
        .insert(charges)
        .values({
          id: charge.id,
          tripId: charge.tripId,
          riderId: charge.riderId,
          driverId: charge.driverId,
          amountCents: charge.amount.cents,
          createdAt: charge.createdAt,
        })
        .onConflictDoNothing({ target: charges.tripId })
        .returning({ id: charges.id });

      if (inserted.length === 0) {
        return false;
      }

      await db.insert(ledgerEntries).values(
        charge.entries.map((entry) => ({ id: randomUUID(), chargeId: charge.id, ...entry })),
      );
      return true;
    });
  }

  async findByTripId(tripId: string): Promise<Charge | null> {
    const db = executorOf(this.root);
    const [row] = await db.select().from(charges).where(eq(charges.tripId, tripId)).limit(1);
    if (!row) {
      return null;
    }

    const entries = await db
      .select({ account: ledgerEntries.account, accountId: ledgerEntries.accountId, amountCents: ledgerEntries.amountCents })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.chargeId, row.id))
      .orderBy(ledgerEntries.account); // ordem do enum: rider, driver, platform

    return Charge.rehydrate({ ...row, entries });
  }
}
