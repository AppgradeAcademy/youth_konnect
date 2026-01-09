const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Setting up initial data...');

  try {
    // 1. Find or create an admin user (or use the first admin)
    let adminUser = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      console.log('You can create one by running: node scripts/create-admin-user.js');
      return;
    }

    console.log(`Using admin user: ${adminUser.name} (${adminUser.email})`);

    // 2. Create or get "AFM Rzeszow" organization
    let organization = await prisma.organization.findUnique({
      where: { name: 'AFM Rzeszow' },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'AFM Rzeszow',
          description: 'AFM Rzeszow Church',
          ownerId: adminUser.id,
        },
      });
      console.log('Created organization: AFM Rzeszow');
    } else {
      console.log('Organization already exists: AFM Rzeszow');
    }

    // 3. Create or get "AFM Youth Connect" group
    let group = await prisma.group.findFirst({
      where: {
        name: 'AFM Youth Connect',
        organizationId: organization.id,
      },
    });

    if (!group) {
      // Check if old "Youth Connect" exists and update it
      const oldGroup = await prisma.group.findFirst({
        where: {
          name: 'Youth Connect',
          organizationId: organization.id,
        },
      });
      
      if (oldGroup) {
        // Update existing group name
        group = await prisma.group.update({
          where: { id: oldGroup.id },
          data: {
            name: 'AFM Youth Connect',
            description: 'AFM Youth Connect Group by AFM Rzeszow',
          },
        });
        console.log('Updated group name from "Youth Connect" to "AFM Youth Connect"');
      } else {
        // Create new group
        group = await prisma.group.create({
          data: {
            name: 'AFM Youth Connect',
            description: 'AFM Youth Connect Group by AFM Rzeszow',
            ownerId: adminUser.id,
            organizationId: organization.id,
          },
        });
        console.log('Created group: AFM Youth Connect');
      }
    } else {
      console.log('Group already exists: AFM Youth Connect');
    }

    // 4. Create chatroom settings for AFM Youth Connect group
    let chatroomSettings = await prisma.chatroomSettings.findUnique({
      where: { groupId: group.id },
    });

    if (!chatroomSettings) {
      chatroomSettings = await prisma.chatroomSettings.create({
        data: {
          groupId: group.id,
          isActive: true,
        },
      });
      console.log('Created chatroom settings for AFM Youth Connect');
    }

    // 5. Add all existing users as members of AFM Youth Connect group
    const allUsers = await prisma.user.findMany({
      where: {
        NOT: {
          groupMemberships: {
            some: {
              groupId: group.id,
            },
          },
        },
      },
    });

    if (allUsers.length > 0) {
      console.log(`Adding ${allUsers.length} users to AFM Youth Connect group...`);
      
      for (const user of allUsers) {
        await prisma.groupMembership.create({
          data: {
            userId: user.id,
            groupId: group.id,
            role: user.id === adminUser.id ? 'admin' : 'member',
          },
        });
      }
      console.log(`Added ${allUsers.length} users to AFM Youth Connect group`);
    } else {
      console.log('All users are already members of AFM Youth Connect');
    }

    // 6. Make all users follow AFM Rzeszow organization
    const usersNotFollowing = await prisma.user.findMany({
      where: {
        NOT: {
          followingOrgs: {
            some: {
              organizationId: organization.id,
            },
          },
        },
      },
    });

    if (usersNotFollowing.length > 0) {
      console.log(`Making ${usersNotFollowing.length} users follow AFM Rzeszow...`);
      
      for (const user of usersNotFollowing) {
        try {
          await prisma.organizationFollow.create({
            data: {
              userId: user.id,
              organizationId: organization.id,
            },
          });
        } catch (error) {
          // Ignore if already following
        }
      }
      console.log(`Made ${usersNotFollowing.length} users follow AFM Rzeszow`);
    } else {
      console.log('All users are already following AFM Rzeszow');
    }

    // 7. Migrate or delete existing chat messages without groupId
    try {
        // Find messages without groupId and assign them to AFM Youth Connect group
        const messagesWithoutGroup = await prisma.chatMessage.findMany({
          where: { groupId: null },
        });

        if (messagesWithoutGroup.length > 0) {
          console.log(`Found ${messagesWithoutGroup.length} messages without groupId`);
          console.log('Assigning them to AFM Youth Connect group...');
        
        await prisma.chatMessage.updateMany({
          where: { groupId: null },
          data: { groupId: group.id },
        });
        
        console.log(`Migrated ${messagesWithoutGroup.length} messages to AFM Youth Connect group`);
      } else {
        console.log('No old messages to migrate');
      }
    } catch (error) {
      console.log('Note: Message migration skipped (may not be needed)');
    }

    console.log('\n✅ Initial data setup completed!');
    console.log(`   - Organization: AFM Rzeszow (ID: ${organization.id})`);
    console.log(`   - Group: AFM Youth Connect (ID: ${group.id})`);
    console.log(`   - Chatroom: Active`);
    console.log(`   - Members: ${await prisma.groupMembership.count({ where: { groupId: group.id } })}`);
    console.log(`   - Followers: ${await prisma.organizationFollow.count({ where: { organizationId: organization.id } })}`);

  } catch (error) {
    console.error('Error setting up initial data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

