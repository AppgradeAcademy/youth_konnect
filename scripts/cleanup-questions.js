// Script to clean up questions older than 30 days
// Can be run manually or scheduled as a cron job

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupQuestions() {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`Cleaning up questions older than: ${thirtyDaysAgo.toISOString()}`);

    // Delete questions older than 30 days
    const result = await prisma.question.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`✅ Successfully deleted ${result.count} question(s) older than 30 days`);
    return result.count;
  } catch (error) {
    console.error('❌ Error cleaning up questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupQuestions()
    .then((count) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { cleanupQuestions };

