import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './src/lib/email.ts';

const prisma = new PrismaClient();

async function testPasswordReset() {
  try {
    console.log('🔍 Checking user: opiwej@speccon.co.za\n');

    const user = await prisma.user.findUnique({
      where: { email: 'opiwej@speccon.co.za' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true
      }
    });

    if (!user) {
      console.log('❌ User not found with email: opiwej@speccon.co.za');
      console.log('\n📋 Available users:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
      });
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name || 'No name'}, ${u.role})`));
      await prisma.$disconnect();
      return;
    }

    console.log('✅ User found:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name || 'Not set'}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log('');

    // Generate reset token
    console.log('🔑 Generating password reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: resetTokenExpiry,
      },
    });

    console.log('✅ Reset token generated and stored');
    console.log('');

    // Send password reset email
    console.log('📧 Sending password reset email...');
    await sendPasswordResetEmail(user.email, resetToken, user.name || '');

    console.log('');
    console.log('✅ Password reset email sent successfully!');
    console.log('');
    console.log('📬 Email sent to: opiwej@speccon.co.za');
    console.log(`🔗 Reset link: http://localhost:5174/reset-password/${resetToken}`);
    console.log('⏰ Link expires in: 1 hour');
    console.log('');
    console.log('📮 Check the inbox for opiwej@speccon.co.za to test the reset process!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordReset();
