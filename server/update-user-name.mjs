import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserName() {
  try {
    const email = 'jnkqubela@gmail.com';
    const newName = 'Jojo';

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    // Update the user's name
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`✅ Successfully updated user name:`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Old Name: ${user.name}`);
    console.log(`   New Name: ${updatedUser.name}`);
    console.log(`   Role: ${updatedUser.role}`);
  } catch (error) {
    console.error('❌ Error updating user name:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserName();
