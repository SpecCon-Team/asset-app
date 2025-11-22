# 🔐 2FA Emergency Reset Guide

## Overview

This guide covers all methods to recover a user's account when they lose access to their two-factor authentication (2FA) and backup codes.

---

## 📱 User Lost Phone - Recovery Methods

### ✅ Method 1: Use Backup Codes (Recommended)

If the user saved their backup codes when setting up 2FA:

1. **Login normally** with email and password
2. When prompted for 6-digit 2FA code, **enter an 8-digit backup code** instead
3. Each backup code can only be used **once**
4. After login, the user can:
   - Disable 2FA in settings
   - Set up 2FA on a new device
   - Generate new backup codes

**Example backup codes:**
```
A1B2C3D4
E5F6G7H8
12345678
```

---

### ✅ Method 2: Admin Reset (Web Interface) ⭐ NEW!

**For admins only** - Use the web interface to reset 2FA for locked-out users.

1. **Login as an admin**
2. Navigate to **Security & Privacy → 2FA Management** in the sidebar
3. You'll see a list of all users with 2FA enabled, including:
   - User email and name
   - Role
   - Remaining backup codes
   - When 2FA was enabled
4. Click **"Reset 2FA"** for the locked-out user
5. Confirm the reset
6. Optionally provide a reason (logged in audit trail)
7. The user's 2FA will be disabled immediately

**What happens after admin reset:**
- User's `twoFactorEnabled` set to `false`
- User's `twoFactorSecret` cleared
- User's `backupCodes` cleared
- User can login without 2FA
- Action is logged in audit trail with admin details
- User should re-enable 2FA immediately for security

**Access the page:**
```
URL: http://localhost:5173/2fa-management
Route: /2fa-management
Requires: ADMIN role
```

---

### ✅ Method 3: Manual Database Reset (Emergency)

Use this method if:
- Admin interface is unavailable
- You have direct database access
- Emergency situation requiring immediate access

#### **Step 1: Connect to the Database**

**Using psql (Command Line):**
```bash
# Local development (from server directory)
docker exec -it asset-app-postgres psql -U postgres -d asset_app

# Or use the connection string
psql "postgresql://postgres:postgres@localhost:5432/asset_app"
```

**Using pgAdmin (GUI):**
1. Open pgAdmin
2. Connect to the server:
   - Host: `localhost`
   - Port: `5432`
   - Database: `asset_app`
   - Username: `postgres`
   - Password: `postgres` (or your password)

#### **Step 2: Find the User**

```sql
-- Find user by email
SELECT
  id,
  email,
  name,
  role,
  "twoFactorEnabled",
  "createdAt"
FROM "User"
WHERE email = 'user@example.com';

-- Or list all users with 2FA enabled
SELECT
  id,
  email,
  name,
  role,
  "twoFactorEnabled"
FROM "User"
WHERE "twoFactorEnabled" = true
ORDER BY email;
```

#### **Step 3: Reset 2FA for the User**

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from step 2
UPDATE "User"
SET
  "twoFactorEnabled" = false,
  "twoFactorSecret" = NULL,
  "backupCodes" = NULL,
  "updatedAt" = NOW()
WHERE id = 'USER_ID_HERE';

-- Example:
UPDATE "User"
SET
  "twoFactorEnabled" = false,
  "twoFactorSecret" = NULL,
  "backupCodes" = NULL,
  "updatedAt" = NOW()
WHERE email = 'user@example.com';
```

#### **Step 4: Verify the Reset**

```sql
SELECT
  email,
  name,
  "twoFactorEnabled",
  "twoFactorSecret",
  "backupCodes"
FROM "User"
WHERE email = 'user@example.com';

-- Should return:
-- twoFactorEnabled: false
-- twoFactorSecret: NULL
-- backupCodes: NULL
```

#### **Step 5: Log the Manual Reset (Optional but Recommended)**

```sql
INSERT INTO "AuditLog" (
  id,
  action,
  "entityType",
  "entityId",
  "userId",
  metadata,
  "createdAt"
)
VALUES (
  gen_random_uuid(),
  'MANUAL_2FA_RESET',
  'User',
  'USER_ID_HERE',
  NULL,
  '{"reason": "Emergency manual reset via database", "resetBy": "Database Administrator", "date": "2025-01-18"}'::jsonb,
  NOW()
);
```

---

## 🔒 Security Best Practices

### After Resetting 2FA:

1. **Notify the user immediately**
   - Email them about the 2FA reset
   - Confirm it was their request
   - Advise them to re-enable 2FA

2. **User should re-enable 2FA immediately:**
   - Go to Profile → Security Settings
   - Click "Enable 2FA"
   - Scan QR code with authenticator app
   - **SAVE THE 10 BACKUP CODES** in a secure location
   - Store backup codes in:
     - Password manager (1Password, LastPass, etc.)
     - Printed paper in safe
     - Encrypted file

3. **Educate users on backup codes:**
   - Backup codes are as important as the password
   - Each code can only be used once
   - Generate new codes if running low (under 5)
   - Never share backup codes with anyone

### Admin Best Practices:

1. **Only reset 2FA when:**
   - User has verified their identity (email, phone, etc.)
   - You're certain it's the actual user
   - User has no other recovery method

2. **Always provide a reason** when resetting 2FA
3. **Monitor audit logs** for suspicious 2FA resets
4. **Follow up** with users after resetting their 2FA

---

## 📊 Monitoring and Audit

### View 2FA Reset Audit Logs:

```sql
-- View all 2FA-related audit logs
SELECT
  "createdAt",
  action,
  "userId",
  metadata
FROM "AuditLog"
WHERE action IN (
  'SETUP_2FA_INITIATED',
  'ENABLE_2FA',
  'DISABLE_2FA',
  'ADMIN_RESET_2FA',
  'MANUAL_2FA_RESET',
  'LOGIN_2FA_SUCCESS',
  'LOGIN_2FA_BACKUP',
  'REGENERATE_BACKUP_CODES'
)
ORDER BY "createdAt" DESC
LIMIT 50;

-- View 2FA resets by admins
SELECT
  al."createdAt",
  al.action,
  al.metadata->>'adminEmail' as admin_email,
  al.metadata->>'targetUserEmail' as target_user,
  al.metadata->>'reason' as reason
FROM "AuditLog" al
WHERE action = 'ADMIN_RESET_2FA'
ORDER BY al."createdAt" DESC;
```

### Web Interface:

1. Navigate to **Audit Logs** in the admin panel
2. Filter by action type: `ADMIN_RESET_2FA`
3. See who reset 2FA for which users and why

---

## 🆘 Troubleshooting

### User still can't login after reset:

1. **Clear browser cache and cookies**
   ```bash
   # Or try incognito/private browsing mode
   ```

2. **Verify 2FA is actually disabled:**
   ```sql
   SELECT email, "twoFactorEnabled" FROM "User" WHERE email = 'user@example.com';
   ```

3. **Check for account lockout:**
   ```sql
   SELECT
     email,
     "loginAttempts",
     "lockoutUntil"
   FROM "User"
   WHERE email = 'user@example.com';

   -- If locked out, reset:
   UPDATE "User"
   SET "loginAttempts" = 0, "lockoutUntil" = NULL
   WHERE email = 'user@example.com';
   ```

### Admin can't access 2FA Management page:

1. **Verify admin role:**
   ```sql
   SELECT email, role FROM "User" WHERE email = 'admin@example.com';
   ```

2. **Check server logs** for errors:
   ```bash
   # In server directory
   npm run dev:server
   # Look for errors when accessing /api/2fa/admin/users-with-2fa
   ```

3. **Verify endpoint is registered:**
   - Check `server/src/index.ts` includes 2FA routes
   - Ensure `server/src/routes/twoFactor.ts` is properly exported

---

## 🎯 Quick Reference

| Method | User Can Access | Admin Action Required | Database Access | Recovery Time |
|--------|----------------|----------------------|-----------------|---------------|
| **Backup Codes** | ✅ Yes | ❌ No | ❌ No | Immediate |
| **Admin Reset (Web)** | ❌ No | ✅ Yes | ❌ No | 1-5 minutes |
| **Database Reset** | ❌ No | ✅ Yes | ✅ Yes | 5-10 minutes |

---

## 📞 Emergency Contacts

If you need assistance:

1. **Contact system administrator** for web-based admin reset
2. **Contact database administrator** for manual database reset
3. **Check audit logs** for suspicious activity
4. **Document all recovery actions** for security compliance

---

## 🔗 Related Documentation

- **2FA Setup Guide**: See user documentation for initial setup
- **Backup Codes Guide**: How to generate and store backup codes
- **Security Policy**: Company policy on 2FA requirements
- **Audit Logs Guide**: How to monitor security events

---

## 📝 Notes

- All 2FA resets are logged in the audit trail
- Users should re-enable 2FA immediately after reset
- Backup codes should be stored securely and never shared
- Regular reminders to users about backup codes importance
- Consider email notifications for 2FA resets

---

**Last Updated**: 2025-01-18
**Version**: 1.0
**Maintained By**: Development Team
