const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting old Event records...');
  try {
    const deleted = await prisma.$executeRaw`DELETE FROM "Event"`;
    console.log(`Deleted ${deleted.count || deleted} old event records.`);
    console.log('Old events deleted successfully!');
  } catch (error) {
    console.error('Error deleting old events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

