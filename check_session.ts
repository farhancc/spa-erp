import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const session = await prisma.whatsAppSession.findFirst({
    where: {
      tenant: {
        slug: 'lavendersparetreat',
      },
    },
  });
  console.log('SESSION DATA:', JSON.stringify(session, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
