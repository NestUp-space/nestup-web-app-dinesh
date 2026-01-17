#!/usr/bin/env npx ts-node

/**
 * Create Admin User Script
 * 
 * Creates a new admin user with full permissions.
 * 
 * Usage:
 *   npx ts-node scripts/create-admin-user.ts --email admin@example.com --name "Admin User" --password "SecurePass123!" --phone "9876543210"
 * 
 * Or with short flags:
 *   npx ts-node scripts/create-admin-user.ts -e admin@example.com -n "Admin User" -p "SecurePass123!" -t "9876543210"
 * 
 * Run from backend directory:
 *   cd backend && npx ts-node ../scripts/create-admin-user.ts --email admin@example.com ...
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface AdminUserArgs {
  email: string;
  name: string;
  password: string;
  phone: string;
}

function parseArgs(): AdminUserArgs | null {
  const args = process.argv.slice(2);
  const parsed: Partial<AdminUserArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '-e':
      case '--email':
        parsed.email = nextArg;
        i++;
        break;
      case '-n':
      case '--name':
        parsed.name = nextArg;
        i++;
        break;
      case '-p':
      case '--password':
        parsed.password = nextArg;
        i++;
        break;
      case '-t':
      case '--phone':
        parsed.phone = nextArg;
        i++;
        break;
      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
    }
  }

  // Validate required fields
  const missingFields: string[] = [];
  if (!parsed.email) missingFields.push('email');
  if (!parsed.name) missingFields.push('name');
  if (!parsed.password) missingFields.push('password');
  if (!parsed.phone) missingFields.push('phone');

  if (missingFields.length > 0) {
    console.error(`\nError: Missing required fields: ${missingFields.join(', ')}\n`);
    printUsage();
    return null;
  }

  return parsed as AdminUserArgs;
}

function printUsage(): void {
  console.log(`
Create Admin User Script
========================

Creates a new admin user with full permissions in the Nestup Web App.

Usage:
  npx ts-node scripts/create-admin-user.ts [options]

Options:
  -e, --email <email>       Email address for the admin user (required)
  -n, --name <name>         Display name for the admin user (required)
  -p, --password <password> Password for the admin user (required)
  -t, --phone <phone>       Phone number for the admin user (required)
  -h, --help                Show this help message

Examples:
  # Create admin from project root
  cd backend && npx ts-node ../scripts/create-admin-user.ts \\
    --email admin@example.com \\
    --name "Admin User" \\
    --password "SecurePassword123!" \\
    --phone "9876543210"

  # Using short flags
  cd backend && npx ts-node ../scripts/create-admin-user.ts \\
    -e admin@example.com \\
    -n "Admin User" \\
    -p "SecurePassword123!" \\
    -t "9876543210"

Notes:
  - Email and phone must be unique in the database
  - Password will be hashed with bcrypt before storing
  - The admin role must already exist in the database (run prisma seed first)
`);
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

function validatePhone(phone: string): boolean {
  // Allow digits only, 10-15 characters
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(phone);
}

async function findAdminRole() {
  // Try to find admin role by name
  const adminRole = await prisma.userRole.findFirst({
    where: {
      OR: [
        { role: 'admin' },
        { role: 'Admin' },
        { roleType: 'admin' },
      ],
    },
  });

  return adminRole;
}

async function createAdminUser(args: AdminUserArgs): Promise<void> {
  console.log('\n🔐 Create Admin User Script\n');
  console.log('='.repeat(50));

  // Validate inputs
  console.log('\n📋 Validating inputs...');

  if (!validateEmail(args.email)) {
    throw new Error(`Invalid email format: ${args.email}`);
  }
  console.log(`  ✓ Email: ${args.email}`);

  const passwordValidation = validatePassword(args.password);
  if (!passwordValidation.valid) {
    throw new Error(`Invalid password: ${passwordValidation.message}`);
  }
  console.log('  ✓ Password: [validated]');

  if (!validatePhone(args.phone)) {
    throw new Error(`Invalid phone format: ${args.phone}. Must be 10-15 digits only.`);
  }
  console.log(`  ✓ Phone: ${args.phone}`);
  console.log(`  ✓ Name: ${args.name}`);

  // Check for existing user with same email
  console.log('\n🔍 Checking for existing users...');
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email: args.email },
  });

  if (existingUserByEmail) {
    throw new Error(`A user with email '${args.email}' already exists.`);
  }
  console.log('  ✓ Email is available');

  // Check for existing user with same phone
  const existingUserByPhone = await prisma.user.findUnique({
    where: { phoneNumber: args.phone },
  });

  if (existingUserByPhone) {
    throw new Error(`A user with phone number '${args.phone}' already exists.`);
  }
  console.log('  ✓ Phone number is available');

  // Find admin role
  console.log('\n🔎 Finding admin role...');
  const adminRole = await findAdminRole();

  if (!adminRole) {
    throw new Error(
      'Admin role not found in database. Please run the database seed first:\n' +
      '  cd backend && npx prisma db seed'
    );
  }
  console.log(`  ✓ Found admin role: "${adminRole.role}" (ID: ${adminRole.id})`);

  // Hash password
  console.log('\n🔒 Hashing password...');
  const hashedPassword = await bcrypt.hash(args.password, 10);
  console.log('  ✓ Password hashed');

  // Create user
  console.log('\n👤 Creating admin user...');
  const newUser = await prisma.user.create({
    data: {
      email: args.email,
      name: args.name,
      password: hashedPassword,
      phoneNumber: args.phone,
      roleId: adminRole.id,
      verified: true,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  console.log('  ✓ User created successfully!');

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Admin User Created Successfully!\n');
  console.log('User Details:');
  console.log(`  ID:      ${newUser.id}`);
  console.log(`  Name:    ${newUser.name}`);
  console.log(`  Email:   ${newUser.email}`);
  console.log(`  Phone:   ${newUser.phoneNumber}`);
  console.log(`  Role:    ${newUser.role.role} (${newUser.role.roleType})`);
  console.log(`  Active:  ${newUser.isActive}`);
  console.log(`  Verified: ${newUser.verified}`);
  console.log(`  Created: ${newUser.createdAt.toISOString()}`);
  console.log('\n' + '='.repeat(50));
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (!args) {
    process.exit(1);
  }

  try {
    await createAdminUser(args);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
