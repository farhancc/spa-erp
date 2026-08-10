import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'lavendrsopa' },
    });
    console.log('TENANT:', JSON.stringify(tenant, null, 2));

    if (tenant) {
      const services = await prisma.service.findMany({
        where: { tenantId: tenant.id },
      });
      console.log(`FOUND ${services.length} SERVICES for tenant ${tenant.slug}:`);
      console.log(JSON.stringify(services.map(s => ({
        id: s.id,
        name: s.name,
        gender: s.gender,
        tags: s.tags,
        outletId: s.outletId,
      })), null, 2));
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
