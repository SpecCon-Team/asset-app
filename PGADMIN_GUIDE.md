# pgAdmin Setup & Usage Guide

## What is pgAdmin?

pgAdmin is a powerful, web-based database management tool for PostgreSQL. It provides:
- 🖥️ **Visual Interface** - Browse tables, view data, run queries
- 📊 **Query Tool** - Write and execute SQL queries with syntax highlighting
- 📈 **Database Insights** - View statistics, performance metrics
- 🔧 **Schema Management** - Create/modify tables, indexes, relationships
- 💾 **Backup/Restore** - Easy database backup and restore

---

## Quick Start

### Access pgAdmin
After starting Docker containers:
1. Open browser: **http://localhost:5050**
2. Login with:
   - **Email:** `admin@admin.com`
   - **Password:** `admin`

### First Time Setup - Connect to Database

#### Step 1: Add New Server
- Click "Add New Server" (or right-click "Servers" → "Register" → "Server")

#### Step 2: General Tab
- **Name:** `Asset App Local`

#### Step 3: Connection Tab
- **Host name/address:** `postgres` (container name) or `asset_app_postgres`
- **Port:** `5432`
- **Maintenance database:** `asset_app`
- **Username:** `postgres`
- **Password:** `postgres`
- ✅ Check "Save password"

#### Step 4: Save
- Click "Save"
- Server should connect successfully

---

## Common Tasks

### 1. View Data in a Table

**Navigate:**
```
Servers → Asset App Local → Databases → asset_app → Schemas → public → Tables
```

**View data:**
- Right-click on any table (e.g., `User`)
- Select "View/Edit Data" → "All Rows"
- Data appears in spreadsheet-like view

### 2. Run SQL Queries

**Open Query Tool:**
- Click on database `asset_app`
- Click "Query Tool" icon (or Tools → Query Tool)

**Example Queries:**

```sql
-- View all users
SELECT * FROM "User";

-- View all tickets
SELECT * FROM "Ticket";

-- Count users by role
SELECT role, COUNT(*)
FROM "User"
GROUP BY role;

-- View tickets with user names
SELECT
  t.id,
  t.title,
  t.status,
  u.name as reporter_name
FROM "Ticket" t
JOIN "User" u ON t."reporterId" = u.id;

-- Find tickets assigned to specific user
SELECT * FROM "Ticket"
WHERE "assignedToId" = 'user-id-here';
```

**Execute Query:**
- Press `F5` or click Execute/Play button
- Results appear in "Data Output" tab below

### 3. Export Data

**Export Table to CSV:**
- Right-click table → "Import/Export"
- Select "Export"
- Choose format (CSV, Excel, JSON)
- Click "OK"

**Export Query Results:**
- Run your query
- Click "Download" icon in results
- Choose format and save

### 4. View Table Structure

**See columns and types:**
- Expand table → "Columns"
- Shows all columns, data types, constraints

**View relationships:**
- Expand table → "Constraints"
- Shows foreign keys, primary keys, unique constraints

### 5. Backup Database

**Full Backup:**
- Right-click `asset_app` database
- Select "Backup..."
- Choose filename and location
- Click "Backup"

**Restore Backup:**
- Right-click `asset_app` database
- Select "Restore..."
- Select backup file
- Click "Restore"

---

## Useful Features

### Dashboard
- Click on database name
- View:
  - Database size
  - Active connections
  - Transactions per second
  - Cache hit ratio

### Query History
- Tools → "Query History"
- See all previously executed queries
- Re-run or copy queries

### ERD (Entity Relationship Diagram)
- Right-click database
- Select "ERD For Database"
- Visual diagram of all tables and relationships

### Statistics
- Click on table
- View "Statistics" tab
- See row counts, index usage, table size

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F5` | Execute query |
| `F7` | Execute current statement |
| `Ctrl + Space` | Auto-complete |
| `Ctrl + /` | Comment/uncomment |
| `Ctrl + S` | Save query |
| `Ctrl + O` | Open query file |

---

## Tips & Best Practices

### 1. Save Frequently Used Queries
- Write your query
- Click "Save" icon
- Give it a name
- Access later from "Files" tab

### 2. Use Transaction Control
For data modifications:
```sql
BEGIN;
-- Your INSERT/UPDATE/DELETE statements
-- Check results
COMMIT;  -- If correct
-- or
ROLLBACK;  -- If something's wrong
```

### 3. Filter Large Tables
Instead of loading all rows:
- Right-click table → "View/Edit Data" → "Filtered Rows"
- Add WHERE clause
- Much faster for large tables

### 4. Use Query Tool Variables
```sql
-- Define variable
\set user_id 'abc-123'

-- Use in query
SELECT * FROM "Ticket"
WHERE "assignedToId" = :'user_id';
```

### 5. Format SQL
- Write messy SQL
- Select all (Ctrl+A)
- Right-click → "Format SQL"
- Auto-formatted!

---

## Common Queries for Asset App

### User Management
```sql
-- All users with their roles
SELECT id, email, name, role, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- Count users by role
SELECT role, COUNT(*) as count
FROM "User"
GROUP BY role;

-- Recent signups
SELECT * FROM "User"
WHERE "createdAt" > NOW() - INTERVAL '7 days';
```

### Ticket Analysis
```sql
-- Tickets by status
SELECT status, COUNT(*) as count
FROM "Ticket"
GROUP BY status;

-- Open tickets older than 30 days
SELECT * FROM "Ticket"
WHERE status = 'OPEN'
AND "createdAt" < NOW() - INTERVAL '30 days';

-- Tickets per user
SELECT
  u.name,
  COUNT(t.id) as ticket_count
FROM "User" u
LEFT JOIN "Ticket" t ON t."reporterId" = u.id
GROUP BY u.id, u.name
ORDER BY ticket_count DESC;
```

### Asset Management
```sql
-- All assets with their types
SELECT * FROM "Asset"
ORDER BY "purchaseDate" DESC;

-- Assets by status
SELECT status, COUNT(*) as count
FROM "Asset"
GROUP BY status;

-- Recently assigned assets
SELECT
  a."assetTag",
  a."serialNumber",
  u.name as assigned_to
FROM "Asset" a
LEFT JOIN "User" u ON a."assignedToId" = u.id
WHERE a."assignedToId" IS NOT NULL;
```

---

## Troubleshooting

### Can't Connect to Database

**Problem:** "could not connect to server"

**Solution:**
1. Check Docker containers are running:
   ```bash
   docker compose ps
   ```
2. Use hostname `postgres` or `asset_app_postgres`
3. Make sure port is `5432`
4. Verify credentials: `postgres` / `postgres`

### pgAdmin Won't Load

**Problem:** http://localhost:5050 not responding

**Solutions:**
```bash
# Restart containers
docker compose restart pgadmin

# Check if running
docker compose ps

# View logs
docker compose logs pgadmin
```

### Lost Connection

**Problem:** "Connection lost"

**Solution:**
- Right-click server
- Select "Disconnect"
- Right-click again
- Select "Connect"

### Query Takes Too Long

**Solutions:**
1. Add LIMIT to query:
   ```sql
   SELECT * FROM "Ticket" LIMIT 100;
   ```
2. Add WHERE clause to filter
3. Cancel query: Click "Stop" button

---

## Access Credentials

### pgAdmin Login
- **URL:** http://localhost:5050
- **Email:** admin@admin.com
- **Password:** admin

### PostgreSQL Database
- **Host:** postgres (in Docker network)
- **Port:** 5432
- **Database:** asset_app
- **Username:** postgres
- **Password:** postgres

---

## Comparison: pgAdmin vs Prisma Studio

| Feature | pgAdmin | Prisma Studio |
|---------|---------|---------------|
| **Purpose** | Full database management | Quick data viewing |
| **SQL Queries** | ✅ Full support | ❌ No SQL |
| **Complex Queries** | ✅ Yes | ❌ Limited |
| **Edit Data** | ✅ Yes | ✅ Yes |
| **Backup/Restore** | ✅ Yes | ❌ No |
| **Visual ERD** | ✅ Yes | ❌ No |
| **Learning Curve** | Medium | Easy |
| **Best For** | Advanced users, SQL | Quick edits |

**Recommendation:** Use both!
- **Prisma Studio** for quick data viewing/editing
- **pgAdmin** for complex queries, backups, analysis

---

## Quick Reference

### Start pgAdmin
```bash
# pgAdmin starts automatically with postgres
docker compose up -d
```

### Stop pgAdmin
```bash
docker compose stop pgadmin
```

### Access pgAdmin
- URL: http://localhost:5050
- Default login: admin@admin.com / admin

### Common Ports
- PostgreSQL: 5432
- pgAdmin: 5050
- Prisma Studio: 5555

---

## Next Steps

1. ✅ Start Docker containers
2. ✅ Open http://localhost:5050
3. ✅ Login to pgAdmin
4. ✅ Add server connection
5. ✅ Explore your database!

Enjoy your professional database management tool! 🎉
