import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  it('padrao e redis, sem precisar de DATABASE_URL', () => {
    expect(loadEnv({})).toMatchObject({
      POSITION_STORE: 'redis',
      REDIS_URL: 'redis://localhost:6379',
      WORKERS: 1,
    });
  });

  it('postgres exige DATABASE_URL', () => {
    expect(() => loadEnv({ POSITION_STORE: 'postgres' })).toThrow(/DATABASE_URL/);
  });
});
