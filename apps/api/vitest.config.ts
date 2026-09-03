import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'es2022',
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: 'es2022',
        useDefineForClassFields: false,
      },
    },
  },
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    testTimeout: 20000,
  },
});
