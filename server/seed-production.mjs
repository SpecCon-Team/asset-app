#!/usr/bin/env node

/**
 * Production Seed Script for Render
 * Run this to seed the production database with demo users
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedProduction() {
  try {
    console.log('🌱 Seeding production database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123456789', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: adminPassword,
        role: 'ADMIN',
        name: 'Admin User',
        emailVerified: true,
        loginAttempts: 0,
        lockoutUntil: null,
      },
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    console.log('✅ Admin user created/updated');

    // Create technician user
    const techPassword = await bcrypt.hash('tech123456789', 10);
    const technician = await prisma.user.upsert({
      where: { email: 'tech@example.com' },
      update: {
        password: techPassword,
        role: 'TECHNICIAN',
        name: 'Technician User',
        isAvailable: true,
        emailVerified: true,
        loginAttempts: 0,
        lockoutUntil: null,
      },
      create: {
        email: 'tech@example.com',
        name: 'Technician User',
        password: techPassword,
        role: 'TECHNICIAN',
        isAvailable: true,
        emailVerified: true,
      },
    });

    console.log('✅ Technician user created/updated');

    // Create regular user
    const userPassword = await bcrypt.hash('password123456', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        password: userPassword,
        role: 'USER',
        name: 'Test User',
        emailVerified: true,
        loginAttempts: 0,
        lockoutUntil: null,
      },
      create: {
        email: 'test@example.com',
        name: 'Test User',
        password: userPassword,
        role: 'USER',
        emailVerified: true,
      },
    });

    console.log('✅ Regular user created/updated');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@example.com / admin123456789');
    console.log('Technician: tech@example.com / tech123456789');
    console.log('User: test@example.com / password123456');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction();