import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('confere a senha certa e recusa a errada', async () => {
    const hash = await hasher.hash('senha-forte');
    expect(await hasher.compare('senha-forte', hash)).toBe(true);
    expect(await hasher.compare('outra', hash)).toBe(false);
  });

  it('hash null (conta inexistente) sempre da false', async () => {
    expect(await hasher.compare('qualquer', null)).toBe(false);
  });
});
