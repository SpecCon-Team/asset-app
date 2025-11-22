#!/usr/bin/env node

/**
 * Test script to verify dual-write synchronization is working
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

const neonUrl = process.env.NEON_DATABASE_URL;
const localUrl = process.env.LOCAL_DATABASE_URL;

const neonClient = new PrismaClient({
  datasources: { db: { url: neonUrl } }
});

const localClient = new PrismaClient({
  datasources: { db: { url: localUrl } }
});

async function testDualWrite() {
  console.log('🧪 Testing Dual-Write Synchronization\n');

  try {
    await neonClient.$connect();
    await localClient.$connect();
    console.log('✅ Connected to both databases\n');

    // Count users in both databases
    const neonUserCount = await neonClient.user.count();
    const localUserCount = await localClient.user.count();

    console.log('📊 Current Status:');
    console.log(`   Neon (Cloud):  ${neonUserCount} users`);
    console.log(`   Docker (Local): ${localUserCount} users`);

    if (neonUserCount === localUserCount) {
      console.log('\n✅ Databases are in sync!');
    } else {
      console.log('\n⚠️  Databases are out of sync');
      console.log('   Run: node syncDatabases.mjs both-ways');
    }

    // Check other models
    console.log('\n📋 Full Database Status:');

    const models = ['user', 'asset', 'ticket', 'comment', 'notification'];

    for (const model of models) {
      const neonCount = await neonClient[model].count();
      const localCount = await localClient[model].count();
      const synced = neonCount === localCount ? '✅' : '⚠️';

      console.log(`   ${synced} ${model.padEnd(12)} | Neon: ${neonCount.toString().padStart(4)} | Local: ${localCount.toString().padStart(4)}`);
    }

    console.log('\n💡 Tip: If dual-write is enabled, new data should sync automatically.');
    console.log('   Check your server logs for: "Dual Write Mode: ENABLED"');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await neonClient.$disconnect();
    await localClient.$disconnect();
  }
}

testDualWrite().catch(console.error);
