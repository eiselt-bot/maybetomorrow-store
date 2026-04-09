import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Vitest config for mt-store unit tests.
// Run with `npm test` (or `npm run test:watch`).
//
// E2E tests live under `e2e/` and use Playwright — those are NOT picked
// up here. Vitest scope is `src/**/*.test.ts`.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'dist', 'e2e'],
    environment: 'node',
    globals: true,
    // Keep runs isolated so module-level state (rate-limit buckets,
    // delivery-fee cache) doesn't leak between tests.
    isolate: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/lib/**/*.ts', 'src/app/actions/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', 'src/lib/db/seed.ts'],
    },
  },
  resolve: {
    alias: {
      // Match the `@/*` alias from tsconfig so test imports work.
      '@': resolve(__dirname, 'src'),
    },
  },
});
