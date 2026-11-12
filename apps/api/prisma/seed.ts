import { PrismaClient } from '@prisma/client';
import { seedReference } from '../src/seed';

const prisma = new PrismaClient();
try {
  await seedReference(prisma);
  console.warn('Seeded categories and starter SMS rules.');
} finally {
  await prisma.$disconnect();
}
