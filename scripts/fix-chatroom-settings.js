const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fixing ChatroomSettings...');

    // Delete all ChatroomSettings without groupId (old records from before group-based chatrooms)
    const deletedCount = await prisma.chatroomSettings.deleteMany({
      where: {
        groupId: null,
      },
    });

    console.log(`Deleted ${deletedCount.count} old ChatroomSettings record(s) without groupId.`);
    console.log('ChatroomSettings will be created automatically when groups are created.');
    console.log('ChatroomSettings fixed successfully!');
  } catch (e) {
    console.error('Error fixing ChatroomSettings:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

