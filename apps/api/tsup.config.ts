import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  clean: true,
  // The shared package ships as TypeScript source, so it must be bundled in.
  noExternal: ['@money-tracker/shared'],
});
