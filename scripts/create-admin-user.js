// Script to create the admin user with specific credentials
// Run with: node scripts/create-admin-user.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating admin user...');
  console.log('Username: admin');
  console.log('Password: AFMRzesow26\n');

  const email = 'admin@afmrzeszow.pl';
  const name = 'Admin';
  const password = 'AFMRzesow26';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to admin role
      const user = await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          role: 'admin',
        },
      });
      console.log('✓ Admin user updated successfully!');
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
    } else {
      // Create new admin user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'admin',
        },
      });
      console.log('✓ Admin user created successfully!');
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

