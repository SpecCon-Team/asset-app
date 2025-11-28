# Production Setup Guide

## Creating Production User Accounts

The production accounts need to be created in your production database before you can log in.

### Step 1: Set Environment Variable

Make sure you have your production database URL set in your `.env` file:

```bash
# In server/.env
NEON_DATABASE_URL=your-production-database-url
# OR
DATABASE_URL=your-production-database-url
```

### Step 2: Run Production Admin Script

From the `server` directory, run:

```bash
cd server
node create-production-admin.mjs
```

This will create/update all three accounts:
- **Admin**: `admin@example.com` / `Admin@123456`
- **User**: `test@example.com` / `User@123456`
- **Technician**: `tech@example.com` / `Tech@123456`

### Step 3: Verify Accounts (Optional)

Check if accounts were created successfully:

```bash
cd server
node check-production-users.mjs
```

This will show:
- Which accounts exist
- Email verification status
- Password match status
- Account lock status

## Production Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin@123456` |
| User | `test@example.com` | `User@123456` |
| Technician | `tech@example.com` | `Tech@123456` |

## Troubleshooting

### Issue: "Invalid credentials" error

**Possible causes:**
1. Accounts don't exist in production database
   - **Solution**: Run `node create-production-admin.mjs`

2. Email not verified
   - **Solution**: The script automatically sets `emailVerified: true`

3. Wrong password
   - **Solution**: Run the script again to reset passwords

4. Account locked
   - **Solution**: The script automatically resets `loginAttempts` and `lockoutUntil`

### Issue: Can't connect to database

**Solution**: 
- Verify `NEON_DATABASE_URL` or `DATABASE_URL` is set correctly
- Check database connection string format
- Ensure database is accessible from your network

### Issue: Script runs but login still fails

**Solution**:
1. Run the check script: `node check-production-users.mjs`
2. Verify password match shows "✅ Yes"
3. Verify email verified shows "✅ Yes"
4. Try logging in again

## Important Notes

⚠️ **Security**: Change all default passwords after first login!

⚠️ **Database**: Make sure you're running the script against the correct production database (not local)

⚠️ **Environment**: The script uses `NEON_DATABASE_URL` or `DATABASE_URL` from your `.env` file

