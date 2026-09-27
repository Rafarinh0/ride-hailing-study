import { InvalidMoneyError } from '../errors';

/**
 * Value Object de dinheiro, em CENTAVOS INTEIROS. Com numero decimal, o JavaScript
 * erra conta (0.1 + 0.2 = 0.30000000000000004); com inteiros, nao existe centavo
 * perdido. Moeda unica (BRL) por enquanto — se entrar outra, ela vira campo aqui.
 */
export class Money {
  private constructor(public readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new InvalidMoneyError(cents);
    }
    return new Money(cents);
  }

  plus(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  minus(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  times(factor: number): Money {
    return Money.fromCents(this.cents * factor);
  }

  /** Porcentagem arredondada para BAIXO: a sobra de centavo nunca some, fica com quem recebe o resto. */
  percent(percentage: number): Money {
    return new Money(Math.floor((this.cents * percentage) / 100));
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
