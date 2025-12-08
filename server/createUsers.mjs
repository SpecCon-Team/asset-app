import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🔧 Creating missing users...');

    // Create Technician User
    const techExists = await prisma.user.findUnique({
      where: { email: 'tech@example.com' }
    });

    if (!techExists) {
      const techPassword = await bcrypt.hash('tech123456', 10);
      const tech = await prisma.user.create({
        data: {
          email: 'tech@example.com',
          name: 'Technician User',
          password: techPassword,
          role: 'TECHNICIAN',
          isAvailable: true,
          emailVerified: true,
          department: 'IT Support',
          location: 'Main Office'
        }
      });
      console.log('✅ Technician user created:');
      console.log('   Email: tech@example.com');
      console.log('   Password: tech123456');
      console.log('   Role: TECHNICIAN');
    } else {
      console.log('✅ Technician user already exists');
      // Update to ensure it's verified
      await prisma.user.update({
        where: { email: 'tech@example.com' },
        data: {
          emailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
    }

    // Create Regular User
    const userExists = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!userExists) {
      const userPassword = await bcrypt.hash('test123456', 10);
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: userPassword,
          role: 'USER',
          isAvailable: true,
          emailVerified: true,
          department: 'General',
          location: 'Main Office'
        }
      });
      console.log('\\n✅ Regular user created:');
      console.log('   Email: test@example.com');
      console.log('   Password: test123456');
      console.log('   Role: USER');
    } else {
      console.log('✅ Regular user already exists');
      // Update to ensure it's verified
      await prisma.user.update({
        where: { email: 'test@example.com' },
        data: {
          emailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null
        }
      });
    }

    // Create PEG User (for PEG client management)
    const pegExists = await prisma.user.findUnique({
      where: { email: 'peg@example.com' }
    });

    if (!pegExists) {
      const pegPassword = await bcrypt.hash('peg123456', 10);
      const peg = await prisma.user.create({
        data: {
          email: 'peg@example.com',
          name: 'PEG Manager',
          password: pegPassword,
          role: 'PEG',
          isAvailable: true,
          emailVerified: true,
          department: 'PEG Operations',
          location: 'Field Office'
        }
      });
      console.log('\\n✅ PEG user created:');
      console.log('   Email: peg@example.com');
      console.log('   Password: peg123456');
      console.log('   Role: PEG');
    } else {
      console.log('✅ PEG user already exists');
    }

    // Show all users
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        isAvailable: true,
        department: true,
        location: true
      },
      orderBy: { role: 'asc' }
    });

    console.log('\\n📋 All users in system:');
    allUsers.forEach(user => {
      console.log(`\\n👤 ${user.name} (${user.role})`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🏢 ${user.department || 'N/A'}`);
      console.log(`   📍 ${user.location || 'N/A'}`);
      console.log(`   ✅ Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   🟢 Available: ${user.isAvailable ? 'Yes' : 'No'}`);
    });

    console.log('\\n🎉 User setup complete!');
    console.log('\\n📝 Login Credentials Summary:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ EMAIL              │ PASSWORD        │ ROLE      │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ admin@example.com  │ password123    │ ADMIN     │');
    console.log('│ tech@example.com   │ tech123456     │ TECHNICIAN│');
    console.log('│ test@example.com   │ test123456     │ USER      │');
    console.log('│ peg@example.com    │ peg123456      │ PEG       │');
    console.log('└─────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();