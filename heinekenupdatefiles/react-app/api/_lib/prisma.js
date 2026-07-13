import { PrismaClient } from '@prisma/client';

// Serverless functions can be re-invoked on a warm container without the
// module cache being reset, so stash the client on `globalThis` to avoid
// exhausting the DB connection pool with a fresh client per invocation.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}
