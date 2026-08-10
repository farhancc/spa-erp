import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'classicstyles' },
    include: {
      outlets: true,
      users: true,
    },
  });

  console.log('--- DATABASE SYNC CHECK ---');
  if (tenant) {
    console.log('✅ Tenant Found:');
    console.log(`  ID: ${tenant.id}`);
    console.log(`  Name: ${tenant.name}`);
    console.log(`  Slug: ${tenant.slug}`);
    console.log(`  Email: ${tenant.email}`);
    
    console.log('\n✅ Outlets Found:');
    tenant.outlets.forEach((o: any) => {
      console.log(`  - Name: ${o.name}, Slug: ${o.slug}, Default: ${o.isDefault}`);
    });

    console.log('\n✅ Users Found:');
    tenant.users.forEach((u: any) => {
      console.log(`  - Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
    });
  } else {
    console.log('❌ Tenant "classicstyles" NOT found in PostgreSQL database.');
  }
}

main().finally(() => prisma.$disconnect());
