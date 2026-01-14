import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize Prisma Client with proper configuration for serverless
// Use singleton pattern to reuse the client across function invocations
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Store in global to prevent multiple instances in serverless environments
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}




