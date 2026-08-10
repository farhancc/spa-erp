import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const services = await prisma.service.findMany({
      take: 5,
    });
    console.log('SERVICES IN DB:');
    console.log(JSON.stringify(services, null, 2));

    if (services.length > 0) {
      const id = services[0].id;
      console.log(`\nAttempting to update service ${id}...`);
      const updated = await prisma.service.update({
        where: { id },
        data: {
          gender: 'UNISEX',
          tags: ['test-tag-1', 'test-tag-2'],
        },
      });
      console.log('UPDATE SUCCESSFUL:');
      console.log(JSON.stringify(updated, null, 2));
    }
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
