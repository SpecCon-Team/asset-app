# Tomorrow's Docker Setup - Simple Checklist ✅

## Before You Start
- [ ] Close all running terminals with your app
- [ ] Stop any running servers (Ctrl+C)
- [ ] Have about 30 minutes free
- [ ] Stable internet connection (for downloading Docker)

---

## Part 1: Install Docker Desktop (15 minutes)

### Step 1.1: Download
- [ ] Go to: https://www.docker.com/products/docker-desktop
- [ ] Click "Download for Windows"
- [ ] Wait for download to complete (~500MB)

### Step 1.2: Install
- [ ] Run `Docker Desktop Installer.exe`
- [ ] ✅ CHECK: "Use WSL 2 instead of Hyper-V" option
- [ ] Click through the installer
- [ ] Restart computer when asked

### Step 1.3: First Launch
- [ ] Open "Docker Desktop" from Start menu
- [ ] Wait for Docker to start (whale icon appears in system tray)
- [ ] Accept terms if prompted
- [ ] Skip the tutorial (optional)

### Step 1.4: Verify Installation
Open PowerShell or Terminal:
```bash
docker --version
docker compose version
```
- [ ] Both commands show version numbers ✅

---

## Part 2: Switch to Local Database (10 minutes)

### Step 2.1: Start PostgreSQL & pgAdmin Containers
```bash
cd C:\Users\Opiwe\OneDrive\Desktop\asset-app\server
docker compose up -d
```
- [ ] First time will download PostgreSQL image (~100MB)
- [ ] First time will download pgAdmin image (~400MB)
- [ ] Command completes successfully

### Step 2.2: Verify Containers are Running
```bash
docker compose ps
```
- [ ] Shows postgres container with "Up" status
- [ ] Shows pgadmin container with "Up" status

### Step 2.3: Backup Current Environment
```bash
cp .env .env.neon-backup
```
- [ ] Backup created successfully

### Step 2.4: Update Database URL
Open `server/.env` in your code editor

**Change this line:**
```
DATABASE_URL="postgresql://neondb_owner:npg_Ift9wmXVQeG7@ep-flat-bread-af4w3ign-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
```

**To this:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asset_app?schema=public"
```
- [ ] File saved with new DATABASE_URL

---

## Part 3: Setup Database (5 minutes)

### Step 3.1: Create Database Schema
```bash
cd C:\Users\Opiwe\OneDrive\Desktop\asset-app\server
npx prisma db push
```
- [ ] Command completes: "The database is synced with the Prisma schema"

### Step 3.2: Seed with Test Data
```bash
npm run seed
```
- [ ] See: "✅ Created/Updated admin"
- [ ] See: "✅ Created/Updated user"
- [ ] See demo credentials printed

### Step 3.3: Verify Data (Choose One)

**Option A: Prisma Studio (Simple)**
```bash
npx prisma studio
```
- [ ] Browser opens at http://localhost:5555
- [ ] Can see User table with 2 users
- [ ] Press Ctrl+C to close when done

**Option B: pgAdmin (Professional)**
- [ ] Open browser: http://localhost:5050
- [ ] Login: admin@admin.com / admin
- [ ] Add server (see PGADMIN_GUIDE.md for details)
- [ ] Browse your database visually

---

## Part 4: Test Your Application (5 minutes)

### Step 4.1: Start Backend
```bash
cd C:\Users\Opiwe\OneDrive\Desktop\asset-app\server
npm run dev
```
- [ ] Server starts without database errors
- [ ] See: "Server running on port 4000"

### Step 4.2: Start Frontend (New Terminal)
```bash
cd C:\Users\Opiwe\OneDrive\Desktop\asset-app\client
npm run dev
```
- [ ] Client starts successfully
- [ ] See: "Local: http://localhost:5173"

### Step 4.3: Test Login
- [ ] Open browser: http://localhost:5173
- [ ] Try login: `admin@example.com` / `admin123`
- [ ] Login successful ✅
- [ ] App loads much faster 🚀

---

## 🎉 SUCCESS! You're Done!

Your app is now running on a local database that:
- ✅ Never hibernates (always fast)
- ✅ Works offline
- ✅ Free with no limits
- ✅ Easy to reset/backup
- ✅ Professional database GUI (pgAdmin)

### Your Database Tools:
- **Application:** http://localhost:5173
- **Prisma Studio:** http://localhost:5555 (run `npx prisma studio`)
- **pgAdmin:** http://localhost:5050 (login: admin@admin.com / admin)

---

## Daily Workflow from Now On

### Start your day:
1. Open Docker Desktop (if not running)
2. Open terminal and start database:
   ```bash
   cd C:\Users\Opiwe\OneDrive\Desktop\asset-app\server
   docker compose up -d
   ```
3. Start backend:
   ```bash
   npm run dev
   ```
4. Start frontend (new terminal):
   ```bash
   cd ../client
   npm run dev
   ```

### End your day:
- You can leave Docker running, or:
  ```bash
  cd server
  docker compose stop
  ```

---

## If Something Goes Wrong

### Docker won't start
- ✅ Open Docker Desktop application
- ✅ Wait for whale icon to be steady (not spinning)

### Can't connect to database
```bash
cd server
docker compose down
docker compose up -d
```

### Need to reset database
```bash
cd server
docker compose down -v
docker compose up -d
npx prisma db push
npm run seed
```

### Want to switch back to Neon
```bash
cd server
cp .env.neon-backup .env
# Restart server
```

---

## Help Files

After setup, check these files for more info:
- 📖 `DOCKER_SETUP_GUIDE.md` - Detailed guide with explanations
- 📋 `DOCKER_QUICK_REFERENCE.md` - Commands you'll use often
- 🗄️ `PGADMIN_GUIDE.md` - Complete pgAdmin tutorial and tips

---

## Estimated Time: 30 minutes total
- Installation: 15 min
- Setup: 10 min
- Testing: 5 min

**Good luck tomorrow! 🚀**

Any issues? The guides above have troubleshooting sections.
