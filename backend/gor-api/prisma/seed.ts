import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Users — password must match frontend demo accounts
  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('cashier123', 10);
  const clientHash = await bcrypt.hash('client123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gor.com' },
    update: { passwordHash: adminHash },
    create: {
      name: 'Admin GOR',
      email: 'admin@gor.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@gor.com' },
    update: { passwordHash: cashierHash },
    create: {
      name: 'Kasir GOR',
      email: 'cashier@gor.com',
      passwordHash: cashierHash,
      role: 'CASHIER',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@gor.com' },
    update: { passwordHash: clientHash },
    create: {
      name: 'Klien GOR',
      email: 'client@gor.com',
      passwordHash: clientHash,
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