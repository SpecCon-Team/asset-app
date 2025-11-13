# Docker & PostgreSQL Quick Reference

## 🚀 Daily Workflow

### Start your day
```bash
# 1. Start Docker Desktop (from Start menu)
# 2. Wait for Docker to be ready (whale icon in system tray)

# 3. Start database
cd server
docker compose up -d

# 4. Start backend
npm run dev

# 5. Start frontend (new terminal)
cd ../client
npm run dev
```

### End your day
```bash
# You can leave Docker running, or stop it:
cd server
docker compose stop
```

---

## 📦 Essential Commands

### Docker Compose
```bash
docker compose up -d          # Start containers in background
docker compose down           # Stop and remove containers (keeps data)
docker compose ps             # List running containers
docker compose logs           # View all logs
docker compose logs -f        # Follow logs in real-time
docker compose restart        # Restart all containers
```

### Database Management
```bash
npx prisma db push           # Update database schema
npx prisma studio            # Open Prisma Studio (simple GUI)
npx prisma generate          # Regenerate Prisma client
npx tsx prisma/seed.ts       # Seed database with data
```

### Database GUIs
```bash
# Prisma Studio (Simple, quick edits)
npx prisma studio            # Opens at http://localhost:5555

# pgAdmin (Professional, SQL queries)
# Already running at http://localhost:5050
# Login: admin@admin.com / admin
```

### Useful Docker Commands
```bash
docker ps                    # List running containers
docker ps -a                 # List all containers
docker images                # List images
docker volume ls             # List volumes (where data is stored)
```

---

## 🔧 Common Tasks

### Reset database (keep schema)
```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

### Completely fresh start
```bash
cd server
docker compose down -v       # ⚠️ Deletes all data!
docker compose up -d
npx prisma db push
npx tsx prisma/seed.ts
```

### Connect to database directly
```bash
docker exec -it server-postgres-1 psql -U postgres -d asset_app
```
SQL commands:
- `\dt` - List tables
- `\d users` - Describe users table
- `SELECT * FROM users;` - Query users
- `\q` - Quit

### Backup & Restore
```bash
# Backup
docker exec server-postgres-1 pg_dump -U postgres asset_app > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250113.sql | docker exec -i server-postgres-1 psql -U postgres asset_app
```

---

## ⚙️ Environment Variables

### Local Database (Docker)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asset_app?schema=public"
JWT_SECRET="dev-secret-change-me"
PORT=4000
```

### Cloud Database (Neon)
```env
DATABASE_URL="postgresql://neondb_owner:npg_Ift9wmXVQeG7@ep-flat-bread-af4w3ign-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="dev-secret-change-me"
PORT=4000
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Docker not starting | Open Docker Desktop app, wait for whale icon |
| Port 5432 in use | `docker compose down` then `docker compose up -d` |
| Can't connect to DB | Check `docker compose ps` - should show "Up" |
| Lost data | Don't use `-v` flag with down command |
| Schema out of sync | Run `npx prisma db push` |
| Prisma errors | Run `npx prisma generate` |

---

## 📱 Database Management Tools

### Prisma Studio (Simple & Quick)
```bash
npx prisma studio
```
- Opens: http://localhost:5555
- View/edit all database tables
- No SQL needed
- Press Ctrl+C to stop

### pgAdmin (Professional & Powerful)
- Always running at: http://localhost:5050
- Login: admin@admin.com / admin
- Run SQL queries
- View database diagrams
- Backup/restore databases
- See `PGADMIN_GUIDE.md` for full tutorial

---

## 🎯 Pro Tips

1. **Keep Docker Desktop running** - It's lightweight and starts containers faster
2. **Use Prisma Studio** - Easiest way to view and edit data
3. **Backup regularly** - Use the backup command before major changes
4. **Check logs** - When things break: `docker compose logs`
5. **Don't use `-v`** - Unless you really want to delete all data

---

## 📞 Getting Help

Check status:
```bash
docker compose ps        # Containers running?
docker compose logs      # Any errors?
docker --version         # Docker installed?
```

Container names:
- `asset_app_postgres` - PostgreSQL database
- `asset_app_pgadmin` - pgAdmin web interface
- Volumes:
  - `server_pgdata` - PostgreSQL data storage
  - `server_pgadmin_data` - pgAdmin settings storage

Services:
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050
- Prisma Studio: http://localhost:5555 (when running)
