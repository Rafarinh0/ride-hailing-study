import { describe, expect, it } from 'vitest';
import { InvalidEmailError } from '../errors';
import { Email } from './email';

describe('Email (value object)', () => {
  it('normaliza espacos e maiusculas', () => {
    const email = Email.create('  Ana@Example.COM ');
    expect(email.value).toBe('ana@example.com');
  });

  it('igualdade e por valor', () => {
    expect(Email.create('a@b.com').equals(Email.create('A@B.com'))).toBe(true);
  });

  it.each(['', 'sem-arroba', 'a@b', 'a b@c.com', '@x.com'])('rejeita "%s"', (raw) => {
    expect(() => Email.create(raw)).toThrow(InvalidEmailError);
  });
});
