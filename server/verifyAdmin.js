const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAdminEmail() {
  try {
    const user = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: { emailVerified: true }
    });
    console.log('✅ Admin user email verified:', user.email);
    console.log('User details:', {
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminEmail();