import type { PrismaClient } from '@prisma/client';
import { BUILTIN_CATEGORIES, DEFAULT_SMS_RULES } from '@money-tracker/shared';

/** Reference data every install needs: the hostel categories and the starter bank rules. Safe to run again. */
export async function seedReference(prisma: PrismaClient) {
  for (const c of BUILTIN_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name, icon: c.icon, isIncome: c.isIncome, userId: null },
      update: { name: c.name, icon: c.icon, isIncome: c.isIncome },
    });
  }
  for (const r of DEFAULT_SMS_RULES) {
    await prisma.smsRuleRow.upsert({
      where: { id: r.id },
      create: { id: r.id, bank: r.bank, sender: r.sender, kind: r.kind, pattern: r.pattern },
      update: {},
    });
  }
}
