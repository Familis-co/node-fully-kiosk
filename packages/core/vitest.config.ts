import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The React tests opt into happy-dom with a `@vitest-environment` docblock,
    // so the transport and JavaScript interface tests stay on plain Node.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/index.ts'],
    },
  },
});
