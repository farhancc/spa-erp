import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('--- ALL POSTGRESQL TENANTS ---');
  tenants.forEach(t => {
    console.log(`- Slug: "${t.slug}", ID: "${t.id}", Name: "${t.name}"`);
  });
}

main().finally(() => prisma.$disconnect());
