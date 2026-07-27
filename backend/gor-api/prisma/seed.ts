import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gor.com' },
    update: {},
    create: {
      name: 'Admin GOR',
      email: 'admin@gor.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@gor.com' },
    update: {},
    create: {
      name: 'Kasir GOR',
      email: 'cashier@gor.com',
      passwordHash,
      role: 'CASHIER',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@gor.com' },
    update: {},
    create: {
      name: 'Klien GOR',
      email: 'client@gor.com',
      passwordHash,
      role: 'CLIENT',
    },
  });

  console.log('Users seeded:', { admin: admin.id, cashier: cashier.id, client: client.id });

  // Courts — clear and reseed to avoid duplicates
  await prisma.court.deleteMany();

  const courts = [
    { name: 'Lapangan 1', type: 'badminton', pricePerHour: 50000 },
    { name: 'Lapangan 2', type: 'badminton', pricePerHour: 50000 },
    { name: 'Lapangan 3', type: 'badminton', pricePerHour: 55000 },
    { name: 'Futsal A', type: 'futsal', pricePerHour: 150000 },
    { name: 'Futsal B', type: 'futsal', pricePerHour: 150000 },
    { name: 'Tennis Court', type: 'tennis', pricePerHour: 100000 },
  ];

  await prisma.court.createMany({ data: courts });

  console.log('Courts seeded:', courts.length);
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());