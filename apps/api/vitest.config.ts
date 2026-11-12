import { defineConfig } from 'vitest/config';

// Loads apps/api/.env so TEST_DATABASE_URL is available locally. In CI the variable is set directly.
try {
  process.loadEnvFile('.env');
} catch {
  /* no .env file */
}

export default defineConfig({
  test: {
    env: { TZ: 'UTC' },
    // The integration tests share one database, so files run one after another.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
