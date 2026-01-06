import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(email: string, name: string, password: string, role: string = 'user') {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
    },
  });
}


