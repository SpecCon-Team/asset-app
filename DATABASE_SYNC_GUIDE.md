# Database Synchronization Guide

This guide explains how your Docker PostgreSQL and Neon PostgreSQL databases work together with automatic synchronization.

## 🔄 How It Works

Your application now has **dual-database support** with automatic synchronization:

- **Development Mode** (`NODE_ENV=development`): Uses Docker (local) as primary
- **Production Mode** (`NODE_ENV=production`): Uses Neon (cloud) as primary
- **Dual-Write Mode** (`ENABLE_DUAL_WRITE=true`): Writes to BOTH databases automatically

## ✅ Current Configuration

Your `.env` file is now configured for automatic dual-write:

```env
NODE_ENV="development"
LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/asset_app"
NEON_DATABASE_URL="postgresql://neondb_owner:npg_Ift9wmXVQeG7@ep-flat-bread-af4w3ign-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
ENABLE_DUAL_WRITE="true"
```

## 🚀 How Automatic Sync Works

When `ENABLE_DUAL_WRITE="true"`:

1. **All write operations** (create, update, delete) are automatically sent to BOTH databases
2. **Primary database** (based on NODE_ENV) handles the request first
3. **Backup database** syncs asynchronously in the background
4. **Failover**: If primary fails, backup database is used automatically

### What Gets Synced Automatically

- ✅ New users, assets, tickets, comments
- ✅ Updates to existing records
- ✅ Deletions
- ✅ All database operations in real-time

## 🛠️ Manual Synchronization

### Sync Existing Data

Use the `syncDatabases.mjs` script to sync existing data:

```bash
# Go to server directory
cd server

# Sync from Neon to Docker (default)
node syncDatabases.mjs neon-to-local

# Sync from Docker to Neon
node syncDatabases.mjs local-to-neon

# Merge both databases (uses latest timestamps)
node syncDatabases.mjs both-ways

# Dry run (preview changes without applying)
node syncDatabases.mjs neon-to-local --dry-run

# Force (skip confirmation)
node syncDatabases.mjs neon-to-local --force
```

### Common Scenarios

#### 🔄 Initial Setup - Copy Production Data to Local
```bash
node syncDatabases.mjs neon-to-local
```

#### ☁️ Deploy Local Changes to Production
```bash
node syncDatabases.mjs local-to-neon --dry-run  # Preview first
node syncDatabases.mjs local-to-neon             # Apply changes
```

#### 🔀 Merge Changes from Both Databases
```bash
node syncDatabases.mjs both-ways
```

## 🐳 Docker Management

### Start Docker PostgreSQL
```bash
cd server
docker-compose up -d
```

### Check Docker Status
```bash
docker ps
```

### Stop Docker PostgreSQL
```bash
docker-compose down
```

### View Docker Logs
```bash
docker logs asset_app_postgres
```

## 📊 Database Access

### PgAdmin (Web Interface)
- URL: http://localhost:5050
- Email: admin@admin.com
- Password: admin

### Direct Connection (Docker)
```bash
psql postgresql://postgres:postgres@localhost:5433/asset_app
```

### Direct Connection (Neon)
Use the Neon console: https://console.neon.tech

## 🔧 Troubleshooting

### Dual-Write Not Working?

1. **Check .env file**:
   ```bash
   grep ENABLE_DUAL_WRITE .env
   ```
   Should show: `ENABLE_DUAL_WRITE="true"`

2. **Restart your application**:
   ```bash
   npm run dev
   ```

3. **Check logs** when starting:
   You should see:
   ```
   ✅ Primary Database: 🐳 Local Docker
   ✅ Backup Database: 🌐 Neon Cloud (Sync Active)
   ♻️  Dual Write Mode: ENABLED
   💾 Data written to BOTH databases automatically
   ```

### Docker Not Starting?

1. **Check if Docker is running**:
   ```bash
   docker ps
   ```

2. **Start Docker containers**:
   ```bash
   cd server
   docker-compose up -d
   ```

3. **Wait for PostgreSQL to be ready** (10-15 seconds)

### Schema Out of Sync?

If databases have different schemas:

```bash
# Push schema to Docker
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/asset_app"
npx prisma db push

# Push schema to Neon
export DATABASE_URL="your-neon-url-here"
npx prisma db push
```

### Connection Errors?

1. **Check database URLs** in `.env`
2. **Verify Docker is running** (for local)
3. **Check internet connection** (for Neon)
4. **Test connections**:
   ```bash
   # Test Docker
   psql postgresql://postgres:postgres@localhost:5433/asset_app -c "SELECT 1"

   # Test Neon (use your actual URL)
   psql "your-neon-url" -c "SELECT 1"
   ```

## 📝 Best Practices

### Development Workflow

1. **Start Docker** before developing:
   ```bash
   cd server && docker-compose up -d
   ```

2. **Enable dual-write** in `.env`:
   ```env
   ENABLE_DUAL_WRITE="true"
   ```

3. **Work normally** - all changes sync automatically

4. **Periodically verify sync**:
   ```bash
   node syncDatabases.mjs both-ways --dry-run
   ```

### Production Deployment

1. **Ensure Neon has latest data**:
   ```bash
   node syncDatabases.mjs local-to-neon --dry-run
   node syncDatabases.mjs local-to-neon
   ```

2. **Deploy application** with:
   ```env
   NODE_ENV="production"
   ENABLE_DUAL_WRITE="true"
   ```

3. **Neon becomes primary**, Docker becomes backup

### Backup Strategy

With dual-write enabled:
- ✅ You always have data in TWO places
- ✅ If internet fails, Docker has your data
- ✅ If Docker fails, Neon has your data
- ✅ Automatic failover between databases

## 🔐 Security Notes

- ⚠️ **Never commit `.env` file** to git
- ✅ Keep database credentials secure
- ✅ Use different credentials for production
- ✅ Regularly backup both databases
- ✅ Monitor sync logs for errors

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🆘 Need Help?

If you encounter issues:

1. Check the application logs
2. Run sync script with `--dry-run` to preview
3. Verify both databases are accessible
4. Check `.env` configuration
5. Review Docker container logs

---

**Status**: ✅ Dual-write synchronization is now ENABLED and active!
