import { describe, expect, it } from 'vitest';
import { Charge } from './charge';
import { Money } from './value-objects/money';

const base = { tripId: 't1', riderId: 'r1', driverId: 'd1' };
const sum = (charge: Charge) => charge.entries.reduce((total, e) => total + e.amountCents, 0);

describe('Charge (aggregate)', () => {
  it('passageiro paga tudo, motorista fica com 80% e a plataforma com 20%', () => {
    const charge = Charge.forTrip({ ...base, amount: Money.fromCents(1000) });

    expect(charge.entries).toEqual([
      { account: 'rider', accountId: 'r1', amountCents: -1000 },
      { account: 'driver', accountId: 'd1', amountCents: 800 },
      { account: 'platform', accountId: null, amountCents: 200 },
    ]);
    expect(sum(charge)).toBe(0);
  });

  it('centavo da divisao fica com o motorista, e o ledger continua fechando', () => {
    const charge = Charge.forTrip({ ...base, amount: Money.fromCents(1056) });

    expect(charge.entries.map((e) => e.amountCents)).toEqual([-1056, 845, 211]);
    expect(sum(charge)).toBe(0);
  });

  it('rehydrate recusa lancamentos que nao somam zero', () => {
    const snapshot = Charge.forTrip({ ...base, amount: Money.fromCents(1000) }).toSnapshot();
    snapshot.entries[2] = { account: 'platform', accountId: null, amountCents: 201 };

    expect(() => Charge.rehydrate(snapshot)).toThrow(/desbalanceado/);
  });
});
