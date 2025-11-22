import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('💾 Testing Backup System\n');

// Test 1: Check if pg_dump is available
console.log('Test 1: Check PostgreSQL Tools');
try {
  const { stdout } = await execAsync('which pg_dump');
  console.log('✅ pg_dump found:', stdout.trim());
} catch (error) {
  console.log('⚠️  pg_dump not found - backups will require PostgreSQL tools');
  console.log('   Install with: sudo apt-get install postgresql-client\n');
}

// Test 2: Check if gzip is available
console.log('\nTest 2: Check Compression Tools');
try {
  const { stdout } = await execAsync('which gzip');
  console.log('✅ gzip found:', stdout.trim());
} catch (error) {
  console.log('❌ gzip not found - compression will not work\n');
}

// Test 3: Check if tar is available
console.log('\nTest 3: Check Archive Tools');
try {
  const { stdout } = await execAsync('which tar');
  console.log('✅ tar found:', stdout.trim());
} catch (error) {
  console.log('❌ tar not found - file backups will not work\n');
}

// Test 4: Test backup directory creation
console.log('\nTest 4: Backup Directory');
try {
  const backupDir = path.join(process.cwd(), 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  console.log('✅ Backup directory created/verified:', backupDir);

  // Test write permissions
  const testFile = path.join(backupDir, '.test');
  await fs.writeFile(testFile, 'test');
  await fs.unlink(testFile);
  console.log('✅ Write permissions confirmed');
} catch (error) {
  console.error('❌ Backup directory error:', error.message);
}

// Test 5: Check environment variables
console.log('\nTest 5: Environment Variables');
const requiredVars = ['DATABASE_URL', 'BACKUP_ENCRYPTION_KEY'];
let allVarsPresent = true;

for (const varName of requiredVars) {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
  } else {
    console.log(`❌ ${varName} is NOT set`);
    allVarsPresent = false;
  }
}

console.log('\n📊 Backup System Status:');
console.log('════════════════════════════════════════');

// Check DATABASE_URL
if (process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL || process.env.NEON_DATABASE_URL) {
  console.log('✅ Database connection configured');
} else {
  console.log('❌ Database connection not configured');
}

// Check encryption key
if (process.env.BACKUP_ENCRYPTION_KEY) {
  console.log('✅ Backup encryption enabled');
} else {
  console.log('⚠️  Backup encryption disabled (key not set)');
}

console.log('\n🎉 Backup system checks complete!');
console.log('\n📝 Next Steps:');
console.log('1. Ensure PostgreSQL client tools are installed');
console.log('2. Enable automated backups in server/src/index.ts');
console.log('3. Test manual backup: node testManualBackup.mjs');
