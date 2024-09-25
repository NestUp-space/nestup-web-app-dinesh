import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';  // Prisma client

export const registerUser = async (data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const role = data.role || 'client';  // Default role is 'client'

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role,
    },
  });
  return user;
};

export const loginUser = async (data: any) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  return { token, role: user.role };  // Return both token and role for the frontend
};


export const resetPassword = async (email: string) => {
  // Implement reset password logic here
};

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
