import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function updateAllPasswords() {
  try {
    console.log('🔧 Updating all user passwords to consistent format...');
    
    // Update admin (already done, but let's make sure)
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (admin) {
      const adminHash = await bcrypt.hash('admin123456789', 10);
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: adminHash }
      });
      console.log('✅ Admin password: admin123456789');
    }
    
    // Update technician
    const tech = await prisma.user.findUnique({
      where: { email: 'tech@example.com' }
    });
    
    if (tech) {
      const techHash = await bcrypt.hash('tech123456789', 10);
      await prisma.user.update({
        where: { id: tech.id },
        data: { password: techHash }
      });
      console.log('✅ Technician password: tech123456789');
    }
    
    // Update test user
    const test = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (test) {
      const testHash = await bcrypt.hash('test123456789', 10);
      await prisma.user.update({
        where: { id: test.id },
        data: { password: testHash }
      });
      console.log('✅ Test user password: test123456789');
    }
    
    // Update PEG user
    const peg = await prisma.user.findUnique({
      where: { email: 'peg@example.com' }
    });
    
    if (peg) {
      const pegHash = await bcrypt.hash('peg123456789', 10);
      await prisma.user.update({
        where: { id: peg.id },
        data: { password: pegHash }
      });
      console.log('✅ PEG user password: peg123456789');
    }
    
    console.log('\\n🎉 All passwords updated successfully!');
    console.log('\\n📝 Updated Login Credentials:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ EMAIL              │ PASSWORD        │ ROLE      │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ admin@example.com  │ admin123456789 │ ADMIN     │');
    console.log('│ tech@example.com   │ tech123456789  │ TECHNICIAN│');
    console.log('│ test@example.com   │ test123456789  │ USER      │');
    console.log('│ peg@example.com    │ peg123456789   │ PEG       │');
    console.log('└─────────────────────────────────────────────────┘');
    
    console.log('\\n💡 All passwords now follow the pattern: [role]123456789');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllPasswords();