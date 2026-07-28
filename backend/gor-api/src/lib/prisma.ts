import { PrismaClient } from '@prisma/client';

// Override DATABASE_URL with external/public URL if set
// Railway auto-injects internal DATABASE_URL that may not be reachable
const dbUrl = process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL;
if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

const prisma = new PrismaClient();

export default prisma;
