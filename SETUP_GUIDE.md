# Setup Guide for Asset Management System

Follow these steps to set up the project on your local machine.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Git

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd asset-app
```

## Step 2: Install Dependencies

### Server Setup
```bash
cd server
npm install
```

### Client Setup
```bash
cd ../client
npm install
```

## Step 3: Database Setup

### Option A: Local PostgreSQL Database

1. Create a new PostgreSQL database:
```bash
# Using psql command line
psql -U postgres
CREATE DATABASE asset_app;
\q
```

2. Create `.env` file in the `server` folder:
```bash
# server/.env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/asset_app"
JWT_SECRET="your-super-secret-jwt-key-change-this"
NODE_ENV="development"
```

### Option B: Use Neon Database (Cloud PostgreSQL)

1. Create a free account at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Create `.env` file in the `server` folder:
```bash
# server/.env
DATABASE_URL="postgresql://username:password@ep-xxxxx.neon.tech/dbname?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-change-this"
NODE_ENV="development"
```

## Step 4: Run Database Migrations

From the `server` folder:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create all tables
npx prisma migrate dev

# (Optional) Seed the database with sample data
npm run seed
```

## Step 5: Start the Application

### Terminal 1 - Start the Server
```bash
cd server
npm run dev
```

The server will start on `http://localhost:4000`

### Terminal 2 - Start the Client
```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`

## Step 6: Login

Open your browser and go to `http://localhost:5173`

### Default Admin Account (if you ran the seed)
- Email: `admin@example.com`
- Password: `password123`

### Create Your Own Account
Click "Sign Up" to create a new account.

## Troubleshooting

### Error: "The table public.User does not exist"
**Solution**: You forgot to run the migrations.
```bash
cd server
npx prisma migrate dev
```

### Error: "trust proxy" validation error
**Solution**: This has been fixed in the latest code. Pull the latest changes:
```bash
git pull origin main
```

### Error: "Connection refused" or "ECONNREFUSED"
**Solution**: Make sure PostgreSQL is running and your DATABASE_URL is correct.

### Port Already in Use
**Solution**:
- For server (port 4000): Find and kill the process using that port
- For client (port 5173): The Vite dev server will automatically use the next available port

### Database Connection Issues
1. Check if PostgreSQL is running:
```bash
# Windows
sc query postgresql-x64-14

# Mac
brew services list

# Linux
sudo systemctl status postgresql
```

2. Verify your DATABASE_URL in `.env`
3. Make sure the database exists
4. Check username/password are correct

## Features

- **Asset Management**: Track and manage company assets
- **Ticket System**: Create and manage support tickets
- **User Management**: Role-based access control (Admin, Technician, User)
- **Workflow Automation**: Automated ticket routing and SLA management
- **2FA Security**: Two-factor authentication support
- **WhatsApp Integration**: Receive notifications via WhatsApp
- **Travel Planner**: Plan and manage business trips
- **PEG System**: Client management by province

## Project Structure

```
asset-app/
├── client/           # React + TypeScript frontend
│   ├── src/
│   │   ├── features/ # Feature modules
│   │   ├── components/ # Shared components
│   │   └── lib/      # Utilities
│   └── package.json
│
├── server/           # Express + TypeScript backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── middleware/ # Express middleware
│   │   └── lib/      # Utilities
│   ├── prisma/       # Database schema
│   └── package.json
│
└── README.md
```

## Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Make sure all dependencies are installed
3. Verify your `.env` configuration
4. Check the terminal for error messages
5. Contact the project maintainer

## Development Tips

- Use `npm run dev` for development with hot reload
- Check `server/src/routes/` to understand API endpoints
- Frontend routes are in `client/src/router.tsx`
- Database schema is in `server/prisma/schema.prisma`

Happy coding! 🚀
