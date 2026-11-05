import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1),
  /** At least 32 characters. Generate with: openssl rand -base64 48 */
  JWT_SECRET: z.string().min(32),
  /** Comma separated list of allowed browser origins. */
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    console.error('Invalid environment:', z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
