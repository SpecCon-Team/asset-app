# Asset App Services Overview

## 🌐 All Your Services & URLs

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSET APP ECOSYSTEM                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🖥️  FRONTEND (React + Vite)                                 │
│  URL: http://localhost:5173                                  │
│  Purpose: Main application interface                         │
│  Login: admin@example.com / admin123                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🔧 BACKEND (Express + TypeScript)                           │
│  URL: http://localhost:4000                                  │
│  Purpose: REST API & authentication                          │
│  Status: /api/health                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🗄️  DATABASE (PostgreSQL 16)                                │
│  Host: localhost:5432                                        │
│  Database: asset_app                                         │
│  Username: postgres                                          │
│  Password: postgres                                          │
│  Container: asset_app_postgres                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🎨 PRISMA STUDIO (Simple DB GUI)                            │
│  URL: http://localhost:5555                                  │
│  Start: npx prisma studio                                    │
│  Purpose: Quick data viewing/editing                         │
│  Best for: Simple CRUD operations                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  🔍 pgADMIN (Professional DB GUI)                            │
│  URL: http://localhost:5050                                  │
│  Login: admin@admin.com / admin                              │
│  Purpose: Advanced database management                       │
│  Best for: SQL queries, backups, analysis                    │
│  Container: asset_app_pgadmin                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Port Reference

| Port | Service | Status | URL |
|------|---------|--------|-----|
| **5173** | Frontend | When running | http://localhost:5173 |
| **4000** | Backend API | When running | http://localhost:4000 |
| **5432** | PostgreSQL | Always (Docker) | localhost:5432 |
| **5050** | pgAdmin | Always (Docker) | http://localhost:5050 |
| **5555** | Prisma Studio | When running | http://localhost:5555 |

---

## 🚦 Service Status

### Always Running (Docker)
✅ PostgreSQL (5432)
✅ pgAdmin (5050)

### Run When Needed
🔵 Frontend (npm run dev in client/)
🔵 Backend (npm run dev in server/)
🔵 Prisma Studio (npx prisma studio)

---

## 🎯 Common Workflows

### Development Workflow
```
1. Start Docker:         docker compose up -d
2. Start Backend:        cd server && npm run dev
3. Start Frontend:       cd client && npm run dev
4. Access App:           http://localhost:5173
```

### Database Management
```
Quick edits:     http://localhost:5555  (Prisma Studio)
Advanced work:   http://localhost:5050  (pgAdmin)
```

### Docker Management
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs

# Stop services
docker compose stop

# Stop and remove (keeps data)
docker compose down
```

---

## 🔐 Credentials Summary

### Application Login
```
Admin:  admin@example.com / admin123
User:   test@example.com / password123
```

### PostgreSQL Database
```
Host:     localhost (or postgres in Docker network)
Port:     5432
Database: asset_app
Username: postgres
Password: postgres
```

### pgAdmin Web Interface
```
URL:      http://localhost:5050
Email:    admin@admin.com
Password: admin
```

### Prisma Studio
```
URL: http://localhost:5555
(No authentication required - runs locally)
```

---

## 📁 File Structure

```
asset-app/
├── client/              # Frontend (React)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── server/              # Backend (Express)
│   ├── src/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── docker-compose.yml  # PostgreSQL + pgAdmin
│   ├── .env                # Environment variables
│   └── seed.mjs            # Database seeding
│
└── Documentation/       # Guides
    ├── TOMORROW_CHECKLIST.md
    ├── DOCKER_SETUP_GUIDE.md
    ├── DOCKER_QUICK_REFERENCE.md
    ├── PGADMIN_GUIDE.md
    ├── PGADMIN_QUICK_START.md
    └── SERVICES_OVERVIEW.md (this file)
```

---

## 🛠️ Useful Commands

### Frontend
```bash
cd client
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend
```bash
cd server
npm run dev          # Start dev server
npm run build        # Compile TypeScript
npm run seed         # Seed database
```

### Prisma
```bash
cd server
npx prisma studio           # Open GUI
npx prisma db push          # Push schema to DB
npx prisma generate         # Generate client
npx prisma migrate dev      # Create migration
```

### Docker
```bash
cd server
docker compose up -d        # Start services
docker compose down         # Stop services
docker compose ps           # List containers
docker compose logs         # View logs
docker compose restart      # Restart services
```

---

## 🎓 Learning Resources

### Quick Start (5 min)
- `PGADMIN_QUICK_START.md` - Get started with pgAdmin

### Full Setup (30 min)
- `TOMORROW_CHECKLIST.md` - Step-by-step Docker setup

### Reference Guides
- `DOCKER_QUICK_REFERENCE.md` - Common Docker commands
- `DOCKER_SETUP_GUIDE.md` - Detailed Docker guide
- `PGADMIN_GUIDE.md` - Complete pgAdmin tutorial

---

## 🔄 Daily Startup Sequence

### Morning - Start Everything
```bash
# 1. Start Docker Desktop (if not running)

# 2. Start database services
cd server
docker compose up -d

# 3. Start backend (in terminal 1)
npm run dev

# 4. Start frontend (in terminal 2)
cd ../client
npm run dev
```

### Evening - Shutdown
```bash
# Frontend & Backend: Press Ctrl+C in their terminals

# Docker (optional - can leave running):
cd server
docker compose stop
```

---

## 💡 Pro Tips

1. **Keep Docker Running** - It's lightweight and saves startup time
2. **Use pgAdmin for Reports** - Better for complex queries and analysis
3. **Use Prisma Studio for Quick Edits** - Faster for simple CRUD
4. **Bookmark URLs** - Save time accessing your services
5. **Check Logs** - Use `docker compose logs` when debugging

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Check for other apps using that port |
| Can't connect to DB | Verify Docker is running: `docker compose ps` |
| pgAdmin not loading | Restart: `docker compose restart pgadmin` |
| Frontend not connecting | Check backend is running on port 4000 |
| Database errors | Run: `npx prisma db push` |

---

## 🎉 You're All Set!

Everything you need is now in one place:
- ✅ Local database (fast & reliable)
- ✅ Professional database GUI (pgAdmin)
- ✅ Simple database GUI (Prisma Studio)
- ✅ Complete documentation
- ✅ Ready to develop!

Happy coding! 🚀
