import { describe, expect, it } from 'vitest';
import { InvalidMoneyError } from '../errors';
import { Money } from './money';

describe('Money', () => {
  it.each([-1, 1.5, Number.NaN])('rejeita %s centavos', (cents) => {
    expect(() => Money.fromCents(cents)).toThrow(InvalidMoneyError);
  });

  it('soma, multiplica e subtrai em centavos', () => {
    const total = Money.fromCents(500).plus(Money.fromCents(50).times(3));
    expect(total.cents).toBe(650);
    expect(total.minus(Money.fromCents(150)).cents).toBe(500);
  });

  it('porcentagem arredonda para baixo', () => {
    expect(Money.fromCents(1055).percent(20).cents).toBe(211); // 211,0
    expect(Money.fromCents(1056).percent(20).cents).toBe(211); // 211,2
  });

  it('subtrair mais do que tem e invalido', () => {
    expect(() => Money.fromCents(1).minus(Money.fromCents(2))).toThrow(InvalidMoneyError);
  });
});
