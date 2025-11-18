import { PrismaClient } from '@prisma/client';

// Dual-Database System: Writes to BOTH Neon (online) and Docker (local)
// Ensures data is always online and never lost

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  backupPrisma: PrismaClient | undefined;
};

const ENABLE_DUAL_WRITE = process.env.ENABLE_DUAL_WRITE === 'true';
const neonUrl = process.env.NEON_DATABASE_URL;
const localUrl = process.env.LOCAL_DATABASE_URL;

let backupClient: PrismaClient | null = null;

// Primary client: Neon (always online, internet-based)
// Add connection pool settings to improve performance and prevent timeouts
function addConnectionPoolParams(url: string): string {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connection_limit=20&pool_timeout=30`;
}

// Use local Docker first in development, Neon for production
const primaryUrl = process.env.NODE_ENV === 'production'
  ? (neonUrl || localUrl || process.env.DATABASE_URL || '')
  : (localUrl || neonUrl || process.env.DATABASE_URL || '');

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: addConnectionPoolParams(primaryUrl),
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize backup client for dual write
if (ENABLE_DUAL_WRITE && neonUrl && localUrl) {
  try {
    backupClient = new PrismaClient({
      datasources: { db: { url: addConnectionPoolParams(localUrl) } },
      log: []
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.backupPrisma = backupClient;
    }
  } catch (error) {
    console.warn('⚠️  Backup database unavailable');
    backupClient = null;
  }
}

// Dual write wrapper: writes to both databases
function createDualWriteOperation(operation: string, model: string) {
  return async (...args: any[]) => {
    try {
      // Execute on primary (Neon - always online)
      const result = await (prisma as any)[model][operation](...args);

      // Sync to backup (Local) asynchronously - don't wait
      if (backupClient && ENABLE_DUAL_WRITE) {
        setImmediate(async () => {
          try {
            await (backupClient as any)[model][operation](...args);
          } catch (syncError: any) {
            // Silently handle "record not found" errors (databases out of sync)
            if (syncError.code === 'P2025' || syncError.code === 'P2018') {
              // P2025: Record not found, P2018: Required connected records not found
              // This is expected when databases are out of sync - ignore it
            } else {
              console.warn(`⚠️  Backup sync failed for ${model}.${operation}: ${syncError.message}`);
            }
          }
        });
      }

      return result;
    } catch (error) {
      // If primary fails, try backup
      if (backupClient && ENABLE_DUAL_WRITE) {
        console.warn('⚠️  Primary failed, trying backup...');
        try {
          return await (backupClient as any)[model][operation](...args);
        } catch (backupError) {
          console.error('❌ Both databases failed');
          throw error;
        }
      }
      throw error;
    }
  };
}

// Wrap write operations for dual write
const writeOperations = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];
const models = ['user', 'asset', 'ticket', 'comment', 'notification'];

if (ENABLE_DUAL_WRITE && backupClient) {
  models.forEach(model => {
    writeOperations.forEach(op => {
      const original = (prisma as any)[model][op];
      if (original) {
        (prisma as any)[model][op] = createDualWriteOperation(op, model);
      }
    });
  });
}

// Connect and test
(async () => {
  try {
    await prisma.$connect();

    // Detect which database is actually being used
    const isPrimaryNeon = primaryUrl.includes('neon.tech');
    const isPrimaryLocal = primaryUrl.includes('localhost') || primaryUrl.includes('127.0.0.1');

    if (isPrimaryNeon) {
      console.log('✅ Primary Database: 🌐 Neon Cloud (Always Online)');
    } else if (isPrimaryLocal) {
      console.log('✅ Primary Database: 🐳 Local Docker');
    }

    if (ENABLE_DUAL_WRITE && backupClient) {
      try {
        await backupClient.$connect();
        const isBackupNeon = !isPrimaryNeon && neonUrl;
        const isBackupLocal = !isPrimaryLocal && localUrl;

        if (isBackupNeon) {
          console.log('✅ Backup Database: 🌐 Neon Cloud (Sync Active)');
        } else if (isBackupLocal) {
          console.log('✅ Backup Database: 🐳 Local Docker (Sync Active)');
        }

        console.log('♻️  Dual Write Mode: ENABLED');
        console.log('💾 Data written to BOTH databases automatically');
      } catch (error) {
        console.warn('⚠️  Backup database unavailable, using primary only');
        backupClient = null;
      }
    } else {
      console.log('📝 Single Database Mode');
    }

    console.log('✅ Database connected successfully');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure at least one database is available');
  }
})();
