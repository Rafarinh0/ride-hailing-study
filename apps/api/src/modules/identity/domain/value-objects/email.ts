import { InvalidEmailError } from '../errors';

/**
 * Value Object Email. Regras dos VOs:
 *  - imutavel (campos readonly, sem setters);
 *  - so existe se for valido (construtor privado + factory que valida);
 *  - igualdade por VALOR, nao por referencia.
 *
 * Efeito: em qualquer lugar do sistema, ter um `Email` em maos ja garante que ele
 * e valido e normalizado. "Estado invalido e irrepresentavel".
 */
export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  private static isValid(value: string): boolean {
    // Regex simples de sanidade. Validacao "de verdade" e mandar um email de
    // confirmacao — regex nao prova que o endereco existe. Suficiente aqui.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
