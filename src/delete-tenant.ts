import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = 'classicstyles';
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  
  if (tenant) {
    console.log(`Cleaning old tenant records for ${slug}...`);
    await prisma.subscription.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.website.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.outlet.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    console.log('✅ Tenant cleaned successfully from PostgreSQL.');
  } else {
    console.log('No existing tenant records found in PostgreSQL.');
  }


}

main().finally(() => prisma.$disconnect());
