import { describe, expect, it } from 'vitest';
import { Driver } from './driver';
import { InvalidDriverError } from './errors';
import { Email } from './value-objects/email';

const email = Email.create('bia@example.com');

describe('Driver (aggregate)', () => {
  it('register cria um motorista valido e trima o nome', () => {
    const driver = Driver.register({ name: '  Bia ', email, passwordHash: 'hash' });
    expect(driver.name).toBe('Bia');
    expect(driver.id).toMatch(/[0-9a-f-]{36}/);
  });

  it('rejeita nome vazio', () => {
    expect(() => Driver.register({ name: ' ', email, passwordHash: 'h' })).toThrow(InvalidDriverError);
  });
});
