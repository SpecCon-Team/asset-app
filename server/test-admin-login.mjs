#!/usr/bin/env node

/**
 * Test Admin Login Script
 * Run this to verify the admin user password in production
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...\n');

    const user = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!user) {
      console.log('❌ Admin user not found in database!');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Email Verified:', user.emailVerified);
    console.log('   Login Attempts:', user.loginAttempts);
    console.log('   Locked Until:', user.lockoutUntil);
    console.log('');

    // Test the seeded password
    const seededPassword = 'admin123456789';
    const isValid = await bcrypt.compare(seededPassword, user.password);

    console.log('🔑 Password Test:');
    console.log('   Testing password:', seededPassword);
    console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');

    if (!isValid) {
      console.log('\n⚠️  Password does not match! Resetting to seeded password...');
      const newHash = await bcrypt.hash(seededPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: newHash,
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
      console.log('✅ Password reset complete!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();