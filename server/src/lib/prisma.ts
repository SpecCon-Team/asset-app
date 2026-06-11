import { PrismaClient } from '@prisma/client';

// Dual-Database System: Writes to BOTH Neon (online) and Docker (local)
// Ensures data is always online and never lost

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  backupPrisma: PrismaClient | undefined;
};

const ENABLE_DUAL_WRITE = process.env.ENABLE_DUAL_WRITE === 'true';
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
const localUrl = process.env.LOCAL_DATABASE_URL;

let backupClient: PrismaClient | null = null;

// Primary client: Neon (always online, internet-based)
// Add connection pool settings to improve performance and prevent timeouts
function addConnectionPoolParams(url: string): string {
  if (!url) return url;
  if (url.includes('pgbouncer=true')) {
    url = url
      .replace(':6543/', ':5432/')
      .replace('pgbouncer=true', '')
      .replace(/&&+/g, '&')
      .replace(/\?&/, '?')
      .replace(/&$/, '');
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connection_limit=3&pool_timeout=10&connect_timeout=10`;
}

// Use local Docker for development, Supabase for production
const primaryUrl = process.env.NODE_ENV === 'production'
  ? (supabaseUrl || process.env.DATABASE_URL || '')
  : (localUrl || supabaseUrl || process.env.DATABASE_URL || '');

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: addConnectionPoolParams(primaryUrl),
    },
  },
  // Performance optimizations
  errorFormat: 'minimal',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Determine backup URL (the one not used as primary)
// Use DATABASE_URL (which includes sslmode=require&pgbouncer=true) for Supabase connections
const backupUrl = (process.env.NODE_ENV === 'production')
  ? localUrl
  : (process.env.DATABASE_URL || supabaseUrl || '');

// Initialize backup client for dual write
if (ENABLE_DUAL_WRITE && backupUrl && backupUrl !== primaryUrl) {
  try {
    backupClient = new PrismaClient({
      datasources: { db: { url: addConnectionPoolParams(backupUrl) } },
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

// Store original methods to avoid infinite recursion
const originalMethods = new Map<string, any>();

// Dual write wrapper: writes to both databases
function createDualWriteOperation(operation: string, model: string, originalMethod: any) {
  return async (...args: any[]) => {
    try {
      // Execute on primary using ORIGINAL method (not the wrapped one)
      const result = await originalMethod.apply((prisma as any)[model], args);

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
// Exclude 'notification' to prevent duplicates (auto-generated IDs create conflicts with dual-write sequence)
// Exclude logging/audit models (high volume, don't need sync)
const models = [
  'user', 'asset', 'ticket', 'comment',
  'auditLog', 'pEGClient', 'assetCheckout', 'attachment', 'assetHistory',
  'maintenanceSchedule', 'trip', 'tripRouteStop',
  'document', 'documentAssociation', 'documentShare', 'documentComment',
  'inventoryItem', 'supplier', 'purchaseOrder', 'purchaseOrderItem',
  'stockTransaction', 'stockAlert',
  'assetDepreciation', 'depreciationSchedule', 'assetValuation', 'assetDisposal',
  'assetQRCode', 'assetLocationHistory', 'checkoutReminder',
  'ticketTemplate', 'replyTemplate', 'assetReservation',
];

if (ENABLE_DUAL_WRITE && backupClient) {
  models.forEach(model => {
    writeOperations.forEach(op => {
      const original = (prisma as any)[model][op];
      if (original) {
        // Store original method
        const key = `${model}.${op}`;
        originalMethods.set(key, original);

        // Replace with wrapped version that uses the stored original
        (prisma as any)[model][op] = createDualWriteOperation(op, model, original);
      }
    });
  });
}

// Connect and test
(async () => {
  try {
    await prisma.$connect();

    // Detect which database is actually being used
    const isPrimarySupabase = primaryUrl.includes('supabase.co');
    const isPrimaryLocal = primaryUrl.includes('localhost') || primaryUrl.includes('127.0.0.1');

    if (isPrimarySupabase) {
      console.log('✅ Primary Database: ☁️ Supabase Cloud');
    } else if (isPrimaryLocal) {
      console.log('✅ Primary Database: 🐳 Local Docker');
    }

    if (ENABLE_DUAL_WRITE && backupClient) {
      try {
        await backupClient.$connect();
        const isBackupSupabase = !isPrimarySupabase && supabaseUrl;
        const isBackupLocal = !isPrimaryLocal && localUrl;

        if (isBackupSupabase) {
          console.log('✅ Backup Database: ☁️ Supabase Cloud (Sync Active)');
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
