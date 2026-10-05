import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000, // Testcontainers sobe o Postgres no beforeAll
  },
});
