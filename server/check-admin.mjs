import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'opiwej@specco.co.za' }
    });

    if (admin) {
      console.log('✅ Admin account synced successfully!');
      console.log('');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('Email Verified:', admin.emailVerified);
      console.log('');
      console.log('🔑 You can login with your existing Neon password!');
    } else {
      console.log('❌ Admin account not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
