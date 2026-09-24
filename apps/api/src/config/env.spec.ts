import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  it('parseia uma DATABASE_URL valida e aplica PORT padrao', () => {
    const env = loadEnv({ DATABASE_URL: 'postgres://u:p@localhost:5432/db' } as NodeJS.ProcessEnv);
    expect(env.DATABASE_URL).toBe('postgres://u:p@localhost:5432/db');
    expect(env.PORT).toBe(3000);
  });

  it('rejeita env sem DATABASE_URL', () => {
    expect(() => loadEnv({} as NodeJS.ProcessEnv)).toThrow();
  });
});
