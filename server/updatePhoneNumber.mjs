import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updatePhoneNumber() {
  try {
    console.log('📱 Update User Phone Number\n');
    console.log('━'.repeat(60));

    // Show all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });

    console.log('\n📋 Current Users:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Phone: ${user.phone || 'Not set'} | Role: ${user.role}`);
      console.log('');
    });

    console.log('━'.repeat(60));

    // Get user selection
    const userIndex = await question('\nWhich user number do you want to update? (1-' + users.length + '): ');
    const selectedUser = users[parseInt(userIndex) - 1];

    if (!selectedUser) {
      console.log('❌ Invalid selection');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    console.log(`\n✅ Selected: ${selectedUser.name} (${selectedUser.email})`);
    console.log(`   Current phone: ${selectedUser.phone || 'Not set'}`);

    // Get new phone number
    const newPhone = await question('\nEnter the new phone number (e.g., +27639477702 or 27639477702): ');

    if (!newPhone || newPhone.trim() === '') {
      console.log('❌ Phone number cannot be empty');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Confirm
    const confirm = await question(`\n⚠️  Update ${selectedUser.name}'s phone to: ${newPhone}? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Update the user
    await prisma.user.update({
      where: { id: selectedUser.id },
      data: { phone: newPhone.trim() }
    });

    console.log('\n✅ Phone number updated successfully!');
    console.log(`\n📱 ${selectedUser.name} → ${newPhone}`);

    console.log('\n━'.repeat(60));
    console.log('✅ Done! You can now send WhatsApp messages from this number.');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

updatePhoneNumber();
