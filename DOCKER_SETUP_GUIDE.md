# Docker Desktop Setup Guide for AssetTrack Pro

## Prerequisites

### 1. Install Docker Desktop

**Windows:**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. During installation, ensure "Use WSL 2 instead of Hyper-V" is checked (recommended)
4. Restart your computer after installation
5. Launch Docker Desktop and wait for it to start (green icon in system tray)

**Mac:**
1. Download Docker Desktop for Mac (Intel or Apple Silicon)
2. Drag Docker.app to Applications folder
3. Open Docker Desktop from Applications
4. Grant necessary permissions when prompted

**Linux:**
1. Follow the official guide: https://docs.docker.com/desktop/install/linux-install/

### 2. Verify Docker Installation

Open a terminal/command prompt and run:
```bash
docker --version
docker-compose --version
```

Both commands should display version numbers.

---

## Project Setup Instructions

### Step 1: Clone/Copy the Project

Make sure you have the entire project folder with all files.

### Step 2: Start Docker Desktop

1. Open Docker Desktop application
2. Wait until it shows "Docker Desktop is running" (green status)
3. Keep Docker Desktop running in the background

### Step 3: Start the Database

Navigate to the project's server folder and start the database:

```bash
cd asset-app/server
docker-compose up -d
```

This will:
- Download PostgreSQL 16 image (first time only)
- Start PostgreSQL on port 5433
- Start pgAdmin on port 5050

### Step 4: Verify Database is Running

```bash
docker ps
```

You should see two containers:
- `asset_app_postgres`
- `asset_app_pgadmin`

### Step 5: Install Dependencies

```bash
# Install root dependencies
cd asset-app
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 6: Setup Environment Variables

Create `server/.env` file with the following content:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/asset_app"

# JWT Secret (change this to a random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Optional: Neon Database (for production)
# NEON_DATABASE_URL="your-neon-connection-string"

# Session Secret
SESSION_SECRET="your-session-secret-change-this"
```

### Step 7: Initialize the Database

```bash
cd server
npx prisma db push
npm run seed
```

This will:
- Create all database tables
- Seed initial data

### Step 8: Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd asset-app/server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd asset-app/client
npm run dev
```

### Step 9: Access the Application

Open your browser and go to: `http://localhost:5174`

---

## Common Issues & Solutions

### Issue 1: "Port is already in use"

**Error:** `Port 5433 is already allocated`

**Solution:**
```bash
# Stop all running containers
docker-compose down

# Check what's using the port
# Windows:
netstat -ano | findstr :5433

# Mac/Linux:
lsof -i :5433

# Kill the process or change the port in docker-compose.yml
```

### Issue 2: Docker Desktop not starting

**Solution:**
1. Restart Docker Desktop
2. Check if virtualization is enabled in BIOS (Windows)
3. For Windows: Enable WSL 2
   ```bash
   wsl --install
   wsl --set-default-version 2
   ```
4. Restart your computer

### Issue 3: "Cannot connect to database"

**Solution:**
1. Check if Docker containers are running:
   ```bash
   docker ps
   ```

2. Check container logs:
   ```bash
   docker logs asset_app_postgres
   ```

3. Restart containers:
   ```bash
   cd server
   docker-compose down
   docker-compose up -d
   ```

### Issue 4: Database connection refused

**Solution:**
- Wait 10-20 seconds after starting Docker containers for database to fully initialize
- Verify the DATABASE_URL in `.env` matches: `postgresql://postgres:postgres@localhost:5433/asset_app`

### Issue 5: "Prisma Client not generated"

**Solution:**
```bash
cd server
npx prisma generate
npx prisma db push
```

### Issue 6: Permission denied on Linux/Mac

**Solution:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker
```

---

## Useful Docker Commands

### View running containers
```bash
docker ps
```

### View all containers (including stopped)
```bash
docker ps -a
```

### Stop all containers
```bash
cd server
docker-compose down
```

### Start containers
```bash
cd server
docker-compose up -d
```

### View container logs
```bash
docker logs asset_app_postgres
docker logs asset_app_pgadmin
```

### Access PostgreSQL CLI
```bash
docker exec -it asset_app_postgres psql -U postgres -d asset_app
```

### Remove all containers and volumes (CAUTION: Deletes all data)
```bash
cd server
docker-compose down -v
```

---

## Access pgAdmin (Optional)

1. Open browser: `http://localhost:5050`
2. Login with:
   - Email: `admin@admin.com`
   - Password: `admin`
3. Add server:
   - Name: `AssetTrack`
   - Host: `postgres` (container name)
   - Port: `5432` (internal port)
   - Username: `postgres`
   - Password: `postgres`
   - Database: `asset_app`

---

## Production Deployment Notes

For production, consider:

1. Use strong passwords in docker-compose.yml
2. Use environment variables for sensitive data
3. Enable SSL/TLS for database connections
4. Use managed database service (Neon, AWS RDS, etc.)
5. Set up proper backup strategy
6. Use Docker secrets for production credentials

---

## Default Login Credentials

After seeding the database:

**Admin:**
- Email: `admin@company.com`
- Password: `Admin123!`

**Technician:**
- Email: `tech@company.com`
- Password: `Tech123!`

**User:**
- Email: `user@company.com`
- Password: `User123!`

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

---

## Getting Help

If you encounter issues:

1. Check Docker Desktop is running (green icon)
2. Review error messages in terminal
3. Check container logs: `docker logs asset_app_postgres`
4. Restart Docker Desktop
5. Try stopping and restarting containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Docker Desktop                   │
│                                          │
│  ┌────────────────┐  ┌────────────────┐│
│  │   PostgreSQL   │  │    pgAdmin     ││
│  │   Port: 5433   │  │   Port: 5050   ││
│  └────────────────┘  └────────────────┘│
└─────────────────────────────────────────┘
           │                    │
           │                    │
    ┌──────▼─────────┐  ┌──────▼─────────┐
    │  Backend API   │  │   Frontend UI  │
    │  Port: 3000    │  │  Port: 5174    │
    │  (Express)     │  │   (React)      │
    └────────────────┘  └────────────────┘
```

---

## Next Steps

After successful setup:

1. Explore the application features
2. Review security documentation
3. Configure WhatsApp notifications (optional)
4. Set up backups
5. Customize for your needs

**Enjoy using AssetTrack Pro! 🚀**
