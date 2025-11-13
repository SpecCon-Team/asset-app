# pgAdmin Quick Start - 5 Minutes ⚡

## What is pgAdmin?
A powerful web-based tool to manage your PostgreSQL database visually.

---

## 🚀 Access pgAdmin (After Docker Setup)

### URL
```
http://localhost:5050
```

### Login Credentials
```
Email: admin@admin.com
Password: admin
```

---

## 📝 First Time Setup - Connect to Database

### Step 1: Add Server
1. Click **"Add New Server"** button
   (or right-click "Servers" → Register → Server)

### Step 2: Fill in Details

**General Tab:**
```
Name: Asset App Local
```

**Connection Tab:**
```
Host:     postgres
Port:     5432
Database: asset_app
Username: postgres
Password: postgres
```
☑️ Check "Save password"

### Step 3: Save
Click **"Save"** button - Done! ✅

---

## 🎯 Common Tasks (After Setup)

### View Table Data
```
Navigate: Servers → Asset App Local → Databases → asset_app
          → Schemas → public → Tables

Right-click table (e.g., "User") → View/Edit Data → All Rows
```

### Run SQL Query
```
1. Click on "asset_app" database
2. Click "Query Tool" icon (top toolbar)
3. Type your SQL:
   SELECT * FROM "User";
4. Press F5 or click Execute button
```

### View All Tables
```
Tables node shows all your tables:
- User
- Ticket
- Asset
- Comment
- Notification
etc.
```

### Export Data
```
Right-click table → Import/Export → Export
Choose format (CSV, Excel, JSON)
```

### Backup Database
```
Right-click "asset_app" → Backup...
Choose filename → Click Backup
```

---

## 💡 Quick SQL Queries

### See all users
```sql
SELECT id, email, name, role FROM "User";
```

### Count tickets by status
```sql
SELECT status, COUNT(*)
FROM "Ticket"
GROUP BY status;
```

### Recent tickets
```sql
SELECT * FROM "Ticket"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Users with their ticket counts
```sql
SELECT
  u.name,
  COUNT(t.id) as ticket_count
FROM "User" u
LEFT JOIN "Ticket" t ON t."reporterId" = u.id
GROUP BY u.id, u.name;
```

---

## 🔧 Useful Features

| Feature | How to Access |
|---------|---------------|
| **Dashboard** | Click database name |
| **ERD Diagram** | Right-click database → ERD For Database |
| **Statistics** | Click table → Statistics tab |
| **Query History** | Tools → Query History |
| **Auto-complete** | Press Ctrl+Space while typing SQL |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F5` | Execute query |
| `F7` | Execute current statement |
| `Ctrl + Space` | Auto-complete |
| `Ctrl + /` | Comment/uncomment line |

---

## 🆚 pgAdmin vs Prisma Studio

| Feature | pgAdmin | Prisma Studio |
|---------|---------|---------------|
| **Run SQL** | ✅ Yes | ❌ No |
| **View Data** | ✅ Yes | ✅ Yes |
| **Edit Data** | ✅ Yes | ✅ Yes |
| **Backup** | ✅ Yes | ❌ No |
| **Visual ERD** | ✅ Yes | ❌ No |
| **Statistics** | ✅ Yes | ❌ No |
| **Best For** | Advanced | Quick edits |

**Tip:** Use both!
- **Prisma Studio** - Quick data viewing/editing
- **pgAdmin** - Complex queries, reports, backups

---

## 🐛 Troubleshooting

### Can't access http://localhost:5050
```bash
# Check if pgAdmin is running
docker compose ps

# Restart if needed
docker compose restart pgadmin

# Check logs
docker compose logs pgadmin
```

### Can't connect to database
- Make sure hostname is `postgres` (not localhost)
- Verify credentials: postgres / postgres
- Check database name: `asset_app`

### Forgot login credentials
```
Email: admin@admin.com
Password: admin
```

---

## 📚 Need More Help?

See complete guide: **`PGADMIN_GUIDE.md`**

Includes:
- Detailed tutorials
- More SQL examples
- Advanced features
- Tips & tricks

---

## ✨ Quick Summary

1. **Access:** http://localhost:5050
2. **Login:** admin@admin.com / admin
3. **Connect:** Host=postgres, DB=asset_app, User=postgres
4. **Use:** Browse tables, run queries, view data!

That's it! Enjoy your professional database tool 🎉
