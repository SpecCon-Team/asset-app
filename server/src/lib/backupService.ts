import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

/**
 * Backup & Disaster Recovery Service
 * Handles automated database backups, file backups, and restoration
 */

export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
  compress: boolean;
  encrypt: boolean;
}

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  size?: number;
  duration?: number;
  error?: string;
}

const DEFAULT_CONFIG: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: path.join(process.cwd(), 'backups'),
  retentionDays: 30,
  compress: true,
  encrypt: true
};

/**
 * Create a database backup
 */
export async function createDatabaseBackup(config: Partial<BackupConfig> = {}): Promise<BackupResult> {
  const startTime = Date.now();
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Ensure backup directory exists
    await fs.mkdir(fullConfig.backupDir, { recursive: true });

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db-backup-${timestamp}.sql`;
    const backupPath = path.join(fullConfig.backupDir, filename);

    // Parse database URL
    const dbUrl = new URL(fullConfig.databaseUrl);
    const dbName = dbUrl.pathname.slice(1);
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const username = dbUrl.username;
    const password = dbUrl.password;

    // Create pg_dump command
    const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} -F p -f "${backupPath}"`;

    console.log(`📦 Creating database backup: ${filename}`);

    // Execute backup (Note: pg_dump needs to be installed)
    await execAsync(dumpCommand);

    // Get backup file size
    const stats = await fs.stat(backupPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Database backup created: ${sizeInMB}MB`);

    // Compress if enabled
    let finalPath = backupPath;
    if (fullConfig.compress) {
      finalPath = await compressBackup(backupPath);
      await fs.unlink(backupPath); // Remove uncompressed version
    }

    // Encrypt if enabled
    if (fullConfig.encrypt) {
      finalPath = await encryptBackup(finalPath);
      await fs.unlink(finalPath.replace('.encrypted', '')); // Remove unencrypted version
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      backupPath: finalPath,
      size: stats.size,
      duration
    };
  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Compress backup file using gzip
 */
async function compressBackup(filePath: string): Promise<string> {
  const compressedPath = `${filePath}.gz`;
  await execAsync(`gzip -c "${filePath}" > "${compressedPath}"`);
  console.log(`📦 Backup compressed: ${path.basename(compressedPath)}`);
  return compressedPath;
}

/**
 * Encrypt backup file
 */
async function encryptBackup(filePath: string): Promise<string> {
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.warn('⚠️  No BACKUP_ENCRYPTION_KEY set, skipping encryption');
    return filePath;
  }

  const encryptedPath = `${filePath}.encrypted`;
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const input = await fs.readFile(filePath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);

  // Save IV + encrypted data
  const output = Buffer.concat([iv, encrypted]);
  await fs.writeFile(encryptedPath, output);

  console.log(`🔒 Backup encrypted: ${path.basename(encryptedPath)}`);
  return encryptedPath;
}

/**
 * Create backup of uploaded files
 */
export async function createFileBackup(config: Partial<BackupConfig> = {}): Promise<BackupResult> {
  const startTime = Date.now();
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    await fs.mkdir(fullConfig.backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `files-backup-${timestamp}.tar.gz`;
    const archivePath = path.join(fullConfig.backupDir, archiveName);

    const uploadsDir = path.join(process.cwd(), 'uploads');

    console.log(`📦 Creating file backup: ${archiveName}`);

    // Create tar.gz archive
    await execAsync(`tar -czf "${archivePath}" -C "${process.cwd()}" uploads`);

    const stats = await fs.stat(archivePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ File backup created: ${sizeInMB}MB`);

    const duration = Date.now() - startTime;

    return {
      success: true,
      backupPath: archivePath,
      size: stats.size,
      duration
    };
  } catch (error: any) {
    console.error('❌ File backup failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(config: Partial<BackupConfig> = {}): Promise<number> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const files = await fs.readdir(fullConfig.backupDir);
    const now = Date.now();
    const retentionMs = fullConfig.retentionDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(fullConfig.backupDir, file);
      const stats = await fs.stat(filePath);

      // Delete if older than retention period
      if (now - stats.mtimeMs > retentionMs) {
        await fs.unlink(filePath);
        deletedCount++;
        console.log(`🗑️  Deleted old backup: ${file}`);
      }
    }

    return deletedCount;
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message);
    return 0;
  }
}

/**
 * List all available backups
 */
export async function listBackups(config: Partial<BackupConfig> = {}): Promise<Array<{
  filename: string;
  size: number;
  created: Date;
  type: 'database' | 'files';
}>> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const files = await fs.readdir(fullConfig.backupDir);
    const backups = [];

    for (const file of files) {
      const filePath = path.join(fullConfig.backupDir, file);
      const stats = await fs.stat(filePath);

      backups.push({
        filename: file,
        size: stats.size,
        created: stats.mtime,
        type: file.startsWith('db-') ? 'database' as const : 'files' as const
      });
    }

    // Sort by creation date, newest first
    backups.sort((a, b) => b.created.getTime() - a.created.getTime());

    return backups;
  } catch (error: any) {
    console.error('❌ Failed to list backups:', error.message);
    return [];
  }
}

/**
 * Restore database from backup
 * WARNING: This will overwrite the current database!
 */
export async function restoreDatabase(backupPath: string): Promise<BackupResult> {
  const startTime = Date.now();

  try {
    console.log(`🔄 Restoring database from: ${path.basename(backupPath)}`);

    // TODO: Implement database restoration logic
    // This requires careful handling and should be done manually in production
    console.warn('⚠️  Database restoration should be done manually in production');
    console.warn('⚠️  Use: psql -U username -d database_name -f backup.sql');

    const duration = Date.now() - startTime;

    return {
      success: false,
      error: 'Manual restoration required'
    };
  } catch (error: any) {
    console.error('❌ Restoration failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Schedule automated backups
 * Run daily at specified hour (default: 2 AM)
 */
export function scheduleAutomatedBackups(hour: number = 2): void {
  const checkAndBackup = async () => {
    const now = new Date();

    // Run backup at specified hour
    if (now.getHours() === hour && now.getMinutes() === 0) {
      console.log('🕐 Running scheduled backup...');

      // Database backup
      const dbResult = await createDatabaseBackup();
      if (dbResult.success) {
        console.log(`✅ Database backup completed in ${dbResult.duration}ms`);
      }

      // File backup
      const fileResult = await createFileBackup();
      if (fileResult.success) {
        console.log(`✅ File backup completed in ${fileResult.duration}ms`);
      }

      // Cleanup old backups
      const deletedCount = await cleanupOldBackups();
      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
      }
    }
  };

  // Check every minute
  setInterval(checkAndBackup, 60 * 1000);

  console.log(`📅 Automated backups scheduled for ${hour}:00 daily`);
}

// Export utility function
export function getBackupSizeInfo(): {
  totalSize: number;
  count: number;
} {
  // Placeholder - implement actual size calculation
  return {
    totalSize: 0,
    count: 0
  };
}
