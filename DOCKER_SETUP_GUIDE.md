# Docker Desktop & Local PostgreSQL Setup Guide

## Step 1: Install Docker Desktop

1. **Download Docker Desktop for Windows**
   - Visit: https://www.docker.com/products/docker-desktop
   - Click "Download for Windows"
   - Wait for the installer to download (about 500MB)

2. **Install Docker Desktop**
   - Run the installer (Docker Desktop Installer.exe)
   - Follow the installation wizard
   - **Important:** Make sure "Use WSL 2 instead of Hyper-V" is checked
   - Click "Ok" to proceed with installation
   - Restart your computer when prompted

3. **Start Docker Desktop**
   - Launch Docker Desktop from Start menu
   - Wait for Docker to start (you'll see a whale icon in system tray)
   - Accept the service agreement if prompted
   - You can skip the tutorial

4. **Verify Docker Installation**
   ```bash
   docker --version
   docker compose version
   ```
   - You should see version numbers for both commands

---

## Step 2: Start Local PostgreSQL Database & pgAdmin

1. **Navigate to server directory**
   ```bash
   cd /mnt/c/Users/Opiwe/OneDrive/Desktop/asset-app/server
   ```

2. **Start PostgreSQL and pgAdmin containers**
   ```bash
   docker compose up -d
   ```
   - `-d` runs it in detached mode (background)
   - First time will download:
     - PostgreSQL image (~100MB)
     - pgAdmin image (~400MB)
   - Subsequent starts will be instant

3. **Verify containers are running**
   ```bash
   docker compose ps
   ```
   - You should see `asset_app_postgres` with status "Up"
   - You should see `asset_app_pgadmin` with status "Up"

---

## Step 3: Update Environment Variables

1. **Backup current .env file**
   ```bash
   cp server/.env server/.env.neon-backup
   ```

2. **Update server/.env file**
   Open `server/.env` and change the DATABASE_URL:

   **FROM (Neon - Cloud):**
   ```
   DATABASE_URL="postgresql://neondb_owner:npg_Ift9wmXVQeG7@ep-flat-bread-af4w3ign-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
   ```

   **TO (Local - Docker):**
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asset_app?schema=public"
   ```

3. **Save the file**

---

## Step 4: Setup Database Schema

1. **Push database schema to local PostgreSQL**
   ```bash
   cd server
   npx prisma db push
   ```
   - This creates all tables, columns, and relationships
   - Should complete in a few seconds

2. **Verify schema is created (Choose one method)**

   **Option A: Prisma Studio (Simple)**
   ```bash
   npx prisma studio
   ```
   - Opens a browser interface at http://localhost:5555
   - You should see all your tables (User, Ticket, Asset, etc.)
   - Press Ctrl+C to stop Prisma Studio

   **Option B: pgAdmin (Professional)**
   - Open browser: http://localhost:5050
   - Login with: admin@admin.com / admin
   - Add server connection (see pgAdmin section below)
   - Browse all tables visually

---

## Step 5: Seed Database with Sample Data

1. **Check if seed file exists**
   ```bash
   ls server/prisma/seed.ts
   ```

2. **Run seed script** (if it exists)
   ```bash
   cd server
   npm run seed
   ```
   OR
   ```bash
   npx tsx prisma/seed.ts
   ```

3. **If no seed file exists, create users manually:**
   - Open Prisma Studio: `npx prisma studio`
   - Navigate to User table
   - Add admin and test users manually
   - Or we can create a seed script together

---

## Step 6: Restart Your Application

1. **Stop current server** (if running)
   - Press Ctrl+C in the terminal running your server

2. **Start server with local database**
   ```bash
   cd server
   npm run dev
   ```

3. **Start client** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```

4. **Test the application**
   - Open browser: http://localhost:5173
   - Try logging in with your test credentials
   - Everything should work faster now!

---

## Step 7: Setup pgAdmin (Optional but Recommended)

pgAdmin is a powerful web-based database management tool that's now running alongside your database.

### Access pgAdmin

1. **Open pgAdmin**
   - Browser: http://localhost:5050
   - Login: admin@admin.com / admin

2. **Add Database Server Connection**
   - Click "Add New Server"

   **General Tab:**
   - Name: `Asset App Local`

   **Connection Tab:**
   - Host: `postgres` (or `asset_app_postgres`)
   - Port: `5432`
   - Database: `asset_app`
   - Username: `postgres`
   - Password: `postgres`
   - ✅ Save password

   - Click "Save"

3. **Explore Your Database**
   - Navigate: Servers → Asset App Local → Databases → asset_app → Schemas → public → Tables
   - Right-click any table → "View/Edit Data" → "All Rows"

### What You Can Do with pgAdmin:
- 📊 Run complex SQL queries
- 📈 View database statistics and performance
- 💾 Backup and restore databases
- 🔍 Browse all tables and relationships
- 📐 View ERD (Entity Relationship Diagrams)
- 🔧 Manage indexes, constraints, and schemas

**Full pgAdmin Guide:** See `PGADMIN_GUIDE.md` for complete tutorial

---

## Useful Docker Commands

### Check running containers
```bash
docker compose ps
```

### View container logs
```bash
docker compose logs postgres
docker compose logs -f postgres  # Follow logs in real-time
```

### Stop PostgreSQL
```bash
cd server
docker compose stop
```

### Start PostgreSQL (after stopping)
```bash
cd server
docker compose start
```

### Restart PostgreSQL
```bash
cd server
docker compose restart
```

### Stop and remove containers (keeps data)
```bash
cd server
docker compose down
```

### Stop and remove everything including data (⚠️ CAREFUL)
```bash
cd server
docker compose down -v  # -v removes volumes (deletes all data)
```

### Connect to PostgreSQL directly (Terminal)
```bash
docker exec -it asset_app_postgres psql -U postgres -d asset_app
```
- Then you can run SQL commands
- Type `\dt` to list all tables
- Type `\q` to quit

### View pgAdmin logs
```bash
docker compose logs pgadmin
docker compose logs -f pgadmin  # Follow in real-time
```

### Restart just pgAdmin
```bash
docker compose restart pgadmin
```

---

## Troubleshooting

### Problem: "Docker daemon is not running"
**Solution:**
- Open Docker Desktop application
- Wait for it to fully start (whale icon should be steady, not animated)

### Problem: "Port 5432 is already in use"
**Solution:**
- Another PostgreSQL is already running
- Check with: `netstat -ano | findstr :5432`
- Stop the other PostgreSQL service or change port in docker-compose.yml

### Problem: "Cannot connect to database"
**Solution:**
```bash
# Stop containers
docker compose down

# Remove volumes
docker volume rm server_pgdata

# Start fresh
docker compose up -d

# Push schema again
npx prisma db push
```

### Problem: Lost all data after restart
**Solution:**
- Docker volumes persist data automatically
- Check volumes exist: `docker volume ls`
- If using `docker compose down -v`, it deletes data
- Use `docker compose down` (without -v) to keep data

---

## Benefits of Local PostgreSQL + pgAdmin

✅ **Much Faster:** No network latency, instant queries
✅ **No Hibernation:** Always running, no cold starts
✅ **Offline Development:** Work without internet
✅ **Free Resources:** No usage limits
✅ **Easy Reset:** Can easily reset/recreate database
✅ **Better for Testing:** Safe to experiment with data
✅ **Professional Tools:** pgAdmin for advanced database management
✅ **Multiple GUIs:** Choose between Prisma Studio (simple) or pgAdmin (advanced)

---

## Switching Back to Neon (if needed)

If you need to switch back to Neon cloud database:

1. **Restore backup**
   ```bash
   cp server/.env.neon-backup server/.env
   ```

2. **Restart server**
   ```bash
   cd server
   npm run dev
   ```

---

## Database Backup & Restore (Local)

### Backup local database

**Method 1: Command Line**
```bash
docker exec asset_app_postgres pg_dump -U postgres asset_app > backup.sql
```

**Method 2: pgAdmin (Easier)**
- Open http://localhost:5050
- Right-click database → "Backup..."
- Choose location and format
- Click "Backup"

### Restore local database

**Method 1: Command Line**
```bash
cat backup.sql | docker exec -i asset_app_postgres psql -U postgres asset_app
```

**Method 2: pgAdmin (Easier)**
- Right-click database → "Restore..."
- Select backup file
- Click "Restore"

---

## Next Steps After Setup

1. ✅ Verify all data migrated correctly
2. ✅ Test all CRUD operations (Create, Read, Update, Delete)
3. ✅ Run any existing tests
4. ✅ Update any documentation with new setup
5. ✅ Consider adding seed script for easy data reset

---

## Need Help?

If you encounter any issues tomorrow:
1. Check Docker Desktop is running (system tray icon)
2. Verify containers are up: `docker compose ps`
3. Check logs: `docker compose logs`
4. Try restarting: `docker compose restart`

Good luck with the setup! 🚀
