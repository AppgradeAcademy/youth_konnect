// Script to create an admin user
// Run with: node scripts/create-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('Create Admin User');
  console.log('=================\n');

  const email = await question('Email: ');
  const name = await question('Name: ');
  const password = await question('Password: ');

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'admin',
      },
    });

    console.log('\n✓ Admin user created successfully!');
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('\n✗ Error: User with this email already exists');
    } else {
      console.error('\n✗ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();


