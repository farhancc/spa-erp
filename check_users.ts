import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Users ---');
  const users = await prisma.user.findMany({
    include: {
      tenant: true,
      primaryOutlet: true,
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
