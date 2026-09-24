import { describe, expect, it } from 'vitest';
import { InvalidRiderError } from './errors';
import { Rider } from './rider';
import { Email } from './value-objects/email';

const email = Email.create('ana@example.com');

describe('Rider (aggregate)', () => {
  it('register cria um rider valido com id e createdAt', () => {
    const rider = Rider.register({ name: 'Ana', email, passwordHash: 'hash' });
    expect(rider.id).toMatch(/[0-9a-f-]{36}/);
    expect(rider.createdAt).toBeInstanceOf(Date);
    expect(rider.email.equals(email)).toBe(true);
  });

  it('trima o nome', () => {
    expect(Rider.register({ name: '  Ana  ', email, passwordHash: 'h' }).name).toBe('Ana');
  });

  it('rejeita nome vazio', () => {
    expect(() => Rider.register({ name: '   ', email, passwordHash: 'h' })).toThrow(InvalidRiderError);
  });
});
