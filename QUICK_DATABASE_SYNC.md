# Quick Database Sync Reference

## ✅ Status: ACTIVE

Your Docker and Neon PostgreSQL databases are now automatically synchronized!

```
✅ Primary Database: 🐳 Local Docker
✅ Backup Database: 🌐 Neon Cloud (Sync Active)
♻️  Dual Write Mode: ENABLED
💾 Data written to BOTH databases automatically
```

## 🚀 Quick Start

### 1. Start Docker (Required)
```bash
cd server
docker start asset_app_postgres
# or
docker-compose up -d
```

### 2. Start Your Application
```bash
cd server
npm run dev
```

You should see:
```
✅ Primary Database: 🐳 Local Docker
✅ Backup Database: 🌐 Neon Cloud (Sync Active)
♻️  Dual Write Mode: ENABLED
💾 Data written to BOTH databases automatically
```

## 🔄 How It Works

- **Every write operation** (create, update, delete) is automatically sent to BOTH databases
- **Docker (local)** is primary in development
- **Neon (cloud)** is backup and syncs automatically
- **No manual work required** - it's all automatic!

## 📋 Common Tasks

### Sync Existing Data
```bash
cd server

# Copy from Neon to Docker (initial setup)
node syncDatabases.mjs neon-to-local

# Copy from Docker to Neon (backup to cloud)
node syncDatabases.mjs local-to-neon

# Merge both databases (smart merge)
node syncDatabases.mjs both-ways

# Preview changes first (dry run)
node syncDatabases.mjs neon-to-local --dry-run
```

### Check Docker Status
```bash
docker ps | grep asset_app
```

### View Logs
```bash
# Docker logs
docker logs asset_app_postgres

# Application logs (shows sync status)
npm run dev
```

## 🔧 Troubleshooting

### Docker Not Running?
```bash
cd server
docker start asset_app_postgres
```

### Sync Not Working?
Check your `.env` file:
```bash
grep ENABLE_DUAL_WRITE server/.env
```
Should show: `ENABLE_DUAL_WRITE="true"`

### Can't Connect to Database?
1. Make sure Docker is running: `docker ps`
2. Check if port 5433 is available
3. Restart Docker: `docker restart asset_app_postgres`

## 📊 Access Databases

### PgAdmin (Web UI)
- **URL**: http://localhost:5050
- **Email**: admin@admin.com
- **Password**: admin

### Neon Console
- **URL**: https://console.neon.tech
- Use your Neon account credentials

## 🎯 Key Benefits

✅ **Automatic Sync** - No manual work needed
✅ **Always Backed Up** - Data in two places
✅ **Failover Ready** - Switches automatically if one fails
✅ **Development Safe** - Use local Docker, still backed up to cloud
✅ **Production Ready** - Can switch to Neon as primary anytime

## 📚 More Info

See **DATABASE_SYNC_GUIDE.md** for complete documentation.

---

**Last Updated**: November 18, 2025
**Status**: ✅ Fully Operational
