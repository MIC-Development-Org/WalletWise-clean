import { PrismaClient } from '@prisma/client';
import { buildApp } from './app';
import { loadEnv } from './env';

const env = loadEnv();
const prisma = new PrismaClient();
const app = await buildApp(env, prisma);

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: env.PORT, host: '0.0.0.0' });
