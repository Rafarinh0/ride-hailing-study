import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Config em .mts (ESM) porque o pacote roda como CommonJS e o unplugin-swc
// depende de modulos ESM-only. swc habilita os decorators do Nest
// (emitDecoratorMetadata) nos testes de integracao; dominio puro nao precisa.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    testTimeout: 60_000,
  },
  plugins: [swc.vite()],
});
