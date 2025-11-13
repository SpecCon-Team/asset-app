import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUserNames() {
  try {
    console.log('🔍 Finding users with "- User" in their names...');

    const users = await prisma.user.findMany();

    let updatedCount = 0;

    for (const user of users) {
      if (user.name && user.name.includes(' - User')) {
        const cleanName = user.name.replace(' - User', '');

        await prisma.user.update({
          where: { id: user.id },
          data: { name: cleanName }
        });

        console.log(`✅ Updated: "${user.name}" → "${cleanName}"`);
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✨ No users found with "- User" in their names');
    } else {
      console.log(`\n🎉 Successfully cleaned up ${updatedCount} user name(s)`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up user names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUserNames();
