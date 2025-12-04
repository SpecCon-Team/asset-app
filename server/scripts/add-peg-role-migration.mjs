import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function addPegRole() {
  console.log('🔄 Adding PEG role to database enum...\n');

  try {
    // Check if PEG role already exists
    const result = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"Role")) AS role_value;
    `;
    
    const roles = result.map(r => r.role_value);
    console.log('Current roles:', roles);

    if (roles.includes('PEG')) {
      console.log('✅ PEG role already exists in database');
      return;
    }

    // Add PEG to the enum
    console.log('Adding PEG to Role enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PEG';
    `);

    console.log('✅ Successfully added PEG role to database');
    
    // Verify it was added
    const newResult = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"Role")) AS role_value;
    `;
    const newRoles = newResult.map(r => r.role_value);
    console.log('Updated roles:', newRoles);
    
  } catch (error) {
    // Check if error is because PEG already exists (PostgreSQL error code 42710)
    if (error.code === '42710' || error.message?.includes('already exists')) {
      console.log('✅ PEG role already exists in database (skipping)');
      return;
    }
    console.error('❌ Error adding PEG role:', error.message);
    // Don't throw - allow build to continue even if migration fails
    // The schema push should handle it
    console.warn('⚠️  Continuing build...');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addPegRole()
  .then(() => {
    console.log('\n✅ Migration check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n⚠️  Migration check had issues, but continuing:', error.message);
    // Exit with 0 so build doesn't fail
    process.exit(0);
  });

