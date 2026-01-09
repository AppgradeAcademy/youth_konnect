const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking Youth Connect chatroom...\n');
    
    const group = await prisma.group.findFirst({
      where: { name: 'Youth Connect' },
      include: {
        chatroomSettings: true,
        organization: true,
        _count: {
          select: {
            members: true,
            presences: true,
            messages: true,
          },
        },
      },
    });

    if (!group) {
      console.log('❌ Group "Youth Connect" not found!');
      return;
    }

    console.log('✅ Group found:');
    console.log(`   Name: ${group.name}`);
    console.log(`   ID: ${group.id}`);
    console.log(`   Organization: ${group.organization?.name || 'None'}`);
    console.log(`   Members: ${group._count.members}`);
    console.log(`   Active users: ${group._count.presences}`);
    console.log(`   Messages: ${group._count.messages}`);
    console.log(`   Chatroom Settings: ${group.chatroomSettings ? '✅ Exists' : '❌ Missing'}`);
    
    if (group.chatroomSettings) {
      console.log(`   Chatroom Active: ${group.chatroomSettings.isActive ? '✅ Yes' : '❌ No'}`);
    } else {
      console.log('\n⚠️  Chatroom settings missing! Creating...');
      await prisma.chatroomSettings.create({
        data: {
          groupId: group.id,
          isActive: true,
        },
      });
      console.log('✅ Chatroom settings created!');
    }

    // Check if it appears in rooms API
    const groupsWithChatrooms = await prisma.group.findMany({
      where: {
        chatroomSettings: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('\n📋 Groups with active chatrooms:');
    groupsWithChatrooms.forEach(g => {
      console.log(`   - ${g.name} (${g.organization?.name || 'No org'})`);
    });

    if (!groupsWithChatrooms.find(g => g.name === 'Youth Connect')) {
      console.log('\n⚠️  Youth Connect not in active chatrooms list!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

