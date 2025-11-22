import { PrismaClient } from '@prisma/client';

// Dual database system - writes to both local and cloud
// Ensures data is always online and never lost

interface DualDatabaseClients {
  primary: PrismaClient;
  backup: PrismaClient | null;
  syncEnabled: boolean;
}

const clients: DualDatabaseClients = {
  primary: null as any,
  backup: null,
  syncEnabled: process.env.ENABLE_DUAL_WRITE === 'true'
};

// Initialize both databases
export function initializeDualDatabase() {
  const neonUrl = process.env.NEON_DATABASE_URL;
  const localUrl = process.env.LOCAL_DATABASE_URL;

  if (!neonUrl) {
    throw new Error('NEON_DATABASE_URL is required for dual write mode');
  }

  // Primary: Neon (always online)
  clients.primary = new PrismaClient({
    datasources: { db: { url: neonUrl } },
    log: ['error', 'warn']
  });

  console.log('🌐 Primary Database: Neon Cloud (Always Online)');

  // Backup: Local Docker (optional)
  if (localUrl && clients.syncEnabled) {
    try {
      clients.backup = new PrismaClient({
        datasources: { db: { url: localUrl } },
        log: []
      });
      console.log('🐳 Backup Database: Local Docker (Sync Enabled)');
      console.log('♻️  Dual Write Mode: ACTIVE - Data written to both databases');
    } catch (error) {
      console.warn('⚠️  Local backup database unavailable, using cloud only');
      clients.backup = null;
    }
  }

  return clients;
}

// Dual write wrapper for Prisma operations
export function createDualWriteProxy(primaryClient: PrismaClient, backupClient: PrismaClient | null) {
  if (!backupClient) {
    return primaryClient; // No backup, return primary only
  }

  // Create a proxy that intercepts Prisma calls
  return new Proxy(primaryClient, {
    get(target, prop) {
      const originalMethod = (target as any)[prop];

      // Only intercept model operations (user, asset, ticket, etc)
      if (typeof originalMethod === 'object' && originalMethod !== null) {
        return new Proxy(originalMethod, {
          get(modelTarget, modelProp) {
            const modelMethod = (modelTarget as any)[modelProp];

            // Intercept write operations
            if (typeof modelMethod === 'function' &&
                ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'].includes(modelProp as string)) {

              return async (...args: any[]) => {
                try {
                  // Write to primary (Neon) first
                  const result = await modelMethod.apply(modelTarget, args);

                  // Write to backup (Local) asynchronously
                  if (backupClient) {
                    setImmediate(async () => {
                      try {
                        await (backupClient as any)[prop][modelProp](...args);
                        console.log(`✅ Synced to backup: ${String(prop)}.${String(modelProp)}`);
                      } catch (error: any) {
                        // Check if it's a unique constraint error
                        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
                          console.warn(`⚠️  Backup sync failed for ${String(prop)}.${String(modelProp)}: Record already exists (${error.meta?.target || 'unique field'})`);
                        } else {
                          console.error(`⚠️  Backup sync failed for ${String(prop)}.${String(modelProp)}: ${error.message}`);
                        }
                        // Don't fail the operation if backup fails
                      }
                    });
                  }

                  return result;
                } catch (error) {
                  console.error(`❌ Primary database operation failed:`, error);
                  throw error;
                }
              };
            }

            return modelMethod;
          }
        });
      }

      return originalMethod;
    }
  });
}

export { clients };
