#!/usr/bin/env node

/**
 * Database Synchronization Script
 *
 * This script synchronizes data between Neon (cloud) and Docker (local) PostgreSQL databases.
 *
 * Usage:
 *   node syncDatabases.mjs [direction] [options]
 *
 * Direction:
 *   neon-to-local  - Copy data from Neon to Docker (default)
 *   local-to-neon  - Copy data from Docker to Neon
 *   both-ways      - Merge data from both databases (uses latest timestamps)
 *
 * Options:
 *   --dry-run      - Show what would be synced without making changes
 *   --force        - Skip confirmation prompts
 *
 * Examples:
 *   node syncDatabases.mjs neon-to-local
 *   node syncDatabases.mjs local-to-neon --dry-run
 *   node syncDatabases.mjs both-ways --force
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const neonUrl = process.env.NEON_DATABASE_URL;
const localUrl = process.env.LOCAL_DATABASE_URL;

if (!neonUrl || !localUrl) {
  console.error('❌ Error: NEON_DATABASE_URL and LOCAL_DATABASE_URL must be set in .env');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const direction = args[0] || 'neon-to-local';
const isDryRun = args.includes('--dry-run');
const isForced = args.includes('--force');

// Validate direction
const validDirections = ['neon-to-local', 'local-to-neon', 'both-ways'];
if (!validDirections.includes(direction)) {
  console.error(`❌ Invalid direction: ${direction}`);
  console.error(`Valid directions: ${validDirections.join(', ')}`);
  process.exit(1);
}

// Initialize Prisma clients
const neonClient = new PrismaClient({
  datasources: { db: { url: neonUrl } },
  log: ['error']
});

const localClient = new PrismaClient({
  datasources: { db: { url: localUrl } },
  log: ['error']
});

// Models to sync (in order to respect foreign key constraints)
const models = [
  'user',
  'asset',
  'ticket',
  'comment',
  'notification',
  'auditLog'
];

// Statistics
const stats = {
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0
};

/**
 * Ask user for confirmation
 */
async function confirm(message) {
  if (isForced) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Sync data from source to target
 */
async function syncData(sourceClient, targetClient, sourceName, targetName) {
  console.log(`\n📊 Syncing from ${sourceName} to ${targetName}...`);

  for (const model of models) {
    try {
      console.log(`\n  Processing ${model}...`);

      // Fetch all records from source
      const sourceRecords = await sourceClient[model].findMany();
      console.log(`    Found ${sourceRecords.length} records in ${sourceName}`);

      if (sourceRecords.length === 0) {
        console.log(`    ⏭️  Skipped (no records)`);
        continue;
      }

      // Fetch existing records from target
      const targetRecords = await targetClient[model].findMany();
      const targetIds = new Set(targetRecords.map(r => r.id));

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const record of sourceRecords) {
        try {
          if (isDryRun) {
            if (targetIds.has(record.id)) {
              console.log(`    [DRY RUN] Would update: ${record.id}`);
              updated++;
            } else {
              console.log(`    [DRY RUN] Would create: ${record.id}`);
              created++;
            }
          } else {
            // Upsert the record
            await targetClient[model].upsert({
              where: { id: record.id },
              create: record,
              update: record
            });

            if (targetIds.has(record.id)) {
              updated++;
            } else {
              created++;
            }
          }
        } catch (error) {
          console.error(`    ❌ Error syncing ${model} ${record.id}:`, error.message);
          stats.errors++;
        }
      }

      console.log(`    ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
      stats.created += created;
      stats.updated += updated;
      stats.skipped += skipped;

    } catch (error) {
      console.error(`    ❌ Error processing ${model}:`, error.message);
      stats.errors++;
    }
  }
}

/**
 * Merge data from both databases (use latest timestamp)
 */
async function mergeBothWays() {
  console.log(`\n🔄 Merging data from both databases (using latest timestamps)...`);

  for (const model of models) {
    try {
      console.log(`\n  Processing ${model}...`);

      // Fetch records from both databases
      const neonRecords = await neonClient[model].findMany();
      const localRecords = await localClient[model].findMany();

      console.log(`    Neon: ${neonRecords.length} records, Local: ${localRecords.length} records`);

      // Create maps for easier lookup
      const neonMap = new Map(neonRecords.map(r => [r.id, r]));
      const localMap = new Map(localRecords.map(r => [r.id, r]));

      // Get all unique IDs
      const allIds = new Set([...neonMap.keys(), ...localMap.keys()]);

      let neonUpdates = 0;
      let localUpdates = 0;

      for (const id of allIds) {
        const neonRecord = neonMap.get(id);
        const localRecord = localMap.get(id);

        try {
          if (!neonRecord && localRecord) {
            // Only in local, copy to Neon
            if (isDryRun) {
              console.log(`    [DRY RUN] Would copy ${id} from Local to Neon`);
            } else {
              await neonClient[model].create({ data: localRecord });
            }
            neonUpdates++;
          } else if (neonRecord && !localRecord) {
            // Only in Neon, copy to local
            if (isDryRun) {
              console.log(`    [DRY RUN] Would copy ${id} from Neon to Local`);
            } else {
              await localClient[model].create({ data: neonRecord });
            }
            localUpdates++;
          } else if (neonRecord && localRecord) {
            // In both, use the one with latest updatedAt timestamp
            const neonTime = neonRecord.updatedAt ? new Date(neonRecord.updatedAt).getTime() : 0;
            const localTime = localRecord.updatedAt ? new Date(localRecord.updatedAt).getTime() : 0;

            if (neonTime > localTime) {
              // Neon is newer, update local
              if (isDryRun) {
                console.log(`    [DRY RUN] Would update ${id} in Local (Neon is newer)`);
              } else {
                await localClient[model].update({
                  where: { id },
                  data: neonRecord
                });
              }
              localUpdates++;
            } else if (localTime > neonTime) {
              // Local is newer, update Neon
              if (isDryRun) {
                console.log(`    [DRY RUN] Would update ${id} in Neon (Local is newer)`);
              } else {
                await neonClient[model].update({
                  where: { id },
                  data: localRecord
                });
              }
              neonUpdates++;
            }
          }
        } catch (error) {
          console.error(`    ❌ Error merging ${model} ${id}:`, error.message);
          stats.errors++;
        }
      }

      console.log(`    ✅ Neon updates: ${neonUpdates}, Local updates: ${localUpdates}`);
      stats.created += neonUpdates + localUpdates;

    } catch (error) {
      console.error(`    ❌ Error processing ${model}:`, error.message);
      stats.errors++;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔄 Database Synchronization Tool\n');
  console.log(`Direction: ${direction}`);
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN' : '✍️  LIVE'}`);
  console.log(`Neon URL: ${neonUrl.substring(0, 50)}...`);
  console.log(`Local URL: ${localUrl}`);

  try {
    // Connect to both databases
    console.log('\n🔌 Connecting to databases...');
    await neonClient.$connect();
    console.log('  ✅ Connected to Neon');
    await localClient.$connect();
    console.log('  ✅ Connected to Docker (Local)');

    // Ask for confirmation
    if (!isDryRun) {
      const shouldContinue = await confirm(`\n⚠️  This will ${direction === 'both-ways' ? 'merge' : 'copy'} data. Continue?`);
      if (!shouldContinue) {
        console.log('❌ Cancelled by user');
        process.exit(0);
      }
    }

    // Execute sync based on direction
    const startTime = Date.now();

    if (direction === 'neon-to-local') {
      await syncData(neonClient, localClient, 'Neon', 'Local');
    } else if (direction === 'local-to-neon') {
      await syncData(localClient, neonClient, 'Local', 'Neon');
    } else if (direction === 'both-ways') {
      await mergeBothWays();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Synchronization Summary');
    console.log('='.repeat(50));
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes made)' : 'LIVE'}`);
    console.log(`Created: ${stats.created}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(50));

    if (isDryRun) {
      console.log('\n💡 Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Synchronization complete!');
    }

  } catch (error) {
    console.error('\n❌ Synchronization failed:', error);
    process.exit(1);
  } finally {
    await neonClient.$disconnect();
    await localClient.$disconnect();
  }
}

// Run the script
main().catch(console.error);
