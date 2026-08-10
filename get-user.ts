import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: 'cmql3vc71000611tz528dvr5b' },
    });
    console.log('USERS:', JSON.stringify(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
    })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
