import { randomUUID } from 'node:crypto';
import { Money } from './value-objects/money';

export const LEDGER_ACCOUNTS = ['rider', 'driver', 'platform'] as const;
export type LedgerAccount = (typeof LEDGER_ACCOUNTS)[number];

/** Um lancamento: negativo sai da conta, positivo entra. Plataforma nao tem id. */
export interface LedgerEntry {
  readonly account: LedgerAccount;
  readonly accountId: string | null;
  readonly amountCents: number;
}

export const PLATFORM_FEE_PERCENT = 20;

export interface ChargeSnapshot {
  id: string;
  tripId: string;
  riderId: string;
  driverId: string;
  amountCents: number;
  createdAt: Date;
  entries: LedgerEntry[];
}

/**
 * Aggregate Cobranca: a cobranca de UMA corrida e os lancamentos que ela gera no
 * ledger. Os lancamentos seguem partidas dobradas: todo dinheiro que sai de uma conta
 * entra em outra, entao a soma e sempre zero. Essa e a invariante que o aggregate
 * protege, e ele e gravado inteiro ou nada (ver o repositorio).
 */
export class Charge {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly riderId: string,
    public readonly driverId: string,
    public readonly amount: Money,
    public readonly createdAt: Date,
    public readonly entries: readonly LedgerEntry[],
  ) {
    const sum = entries.reduce((total, entry) => total + entry.amountCents, 0);
    if (sum !== 0) {
      // Nao e erro de entrada do usuario: e bug. Por isso Error comum (500).
      throw new Error(`ledger desbalanceado na cobranca ${id}: soma ${sum}`);
    }
  }

  /**
   * Passageiro paga tudo; a plataforma fica com a taxa (arredondada para baixo) e o
   * motorista com o resto. Como o motorista recebe "total - taxa", o centavo da
   * divisao nunca se perde.
   */
  static forTrip(input: { tripId: string; riderId: string; driverId: string; amount: Money }): Charge {
    const fee = input.amount.percent(PLATFORM_FEE_PERCENT);
    const entries: LedgerEntry[] = [
      { account: 'rider', accountId: input.riderId, amountCents: -input.amount.cents },
      { account: 'driver', accountId: input.driverId, amountCents: input.amount.minus(fee).cents },
      { account: 'platform', accountId: null, amountCents: fee.cents },
    ];
    return new Charge(randomUUID(), input.tripId, input.riderId, input.driverId, input.amount, new Date(), entries);
  }

  /** Reconstroi do banco. A invariante roda de novo no construtor: dado corrompido nao passa. */
  static rehydrate(snapshot: ChargeSnapshot): Charge {
    return new Charge(
      snapshot.id,
      snapshot.tripId,
      snapshot.riderId,
      snapshot.driverId,
      Money.fromCents(snapshot.amountCents),
      snapshot.createdAt,
      snapshot.entries,
    );
  }

  toSnapshot(): ChargeSnapshot {
    return {
      id: this.id,
      tripId: this.tripId,
      riderId: this.riderId,
      driverId: this.driverId,
      amountCents: this.amount.cents,
      createdAt: this.createdAt,
      entries: [...this.entries],
    };
  }
}
