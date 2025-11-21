# 🔐 Credential Rotation Guide - URGENT

**Status**: ⚠️ CRITICAL - DO THIS BEFORE PRODUCTION DEPLOYMENT
**Priority**: HIGHEST
**Time Required**: 30-45 minutes

---

## 🚨 Why This Is Critical

Your `.env` file containing sensitive credentials has been committed to git. This means:
- Anyone with access to your git repository can see your secrets
- Your database, WhatsApp API, and email accounts could be compromised
- Production deployment with these credentials is a **MAJOR SECURITY RISK**

---

## ✅ Step-by-Step Credential Rotation

### **Step 1: Rotate JWT_SECRET** (5 minutes)

**Current exposed secret**: `a757280f7fbae0373f10d01191261302075508adb509f7364261d048ad790cb2c6c830c823e4d525db624972ae49f8228ac778f30523278a0698192ca8d995d3`

**Action**:
```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and update server/.env:
# JWT_SECRET="<new_secret_here>"
```

**Impact**: All existing JWT tokens will be invalidated. Users will need to log in again.

---

### **Step 2: Rotate Database Passwords** (10 minutes)

#### Local Database (Docker):
```bash
# 1. Stop the Docker container
docker stop <container_name>

# 2. Update docker-compose.yml with new password
# 3. Update LOCAL_DATABASE_URL in server/.env

# 4. Restart container
docker-compose up -d
```

#### Neon Cloud Database:
```bash
# 1. Go to: https://console.neon.tech
# 2. Select your project
# 3. Go to Settings → Reset Password
# 4. Copy the new connection string
# 5. Update NEON_DATABASE_URL in server/.env
```

---

### **Step 3: Rotate WhatsApp Access Token** (10 minutes)

**Current exposed token**: `EAATRr7eNZB0YBPyQZBAc86UPlfiZCdKiMTvZCt9SaT91kfN9c0DZAc7q3A8s7ft8kij2iUUnQOPGXZAa7uROV6hudQGLaZClnjMnJxWAE8MMRkwV0mUoO4JI9rOokQHxY5OFc7gljwsTsn2zJXhTdX040uu9f2Und2sGFDJi7xXfmrPKPYjMdanhBtcDFZC63T4ahgZDZD`

**Action**:
1. Go to: https://developers.facebook.com
2. Select your app
3. Go to: WhatsApp → API Setup
4. Click "Generate New Token"
5. Select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. Copy the new token
7. Update `WHATSAPP_ACCESS_TOKEN` in `server/.env`

**IMPORTANT**: Also get your `WHATSAPP_APP_SECRET`:
1. Go to: Settings → Basic
2. Click "Show" next to App Secret
3. Update `WHATSAPP_APP_SECRET` in `server/.env`

---

### **Step 4: Rotate Email Password** (5 minutes)

**Current exposed password**: `czsy nvaq kwzc yquc`

**Action for Gmail**:
1. Go to: https://myaccount.google.com/apppasswords
2. Delete the old "Asset App" app password
3. Create a new app password:
   - Name: Asset App (New)
   - Generate
4. Copy the new 16-character password
5. Update `EMAIL_PASSWORD` in `server/.env`

**If using another email provider**, follow their process for generating app passwords.

---

### **Step 5: Update All Session Secrets** (Already Done ✅)

These have been generated for you:
- ✅ `SESSION_SECRET`: `75805ed0f0d5424efd478f40d4af090e0a9c06a4e47bdf97b84a6e8674e8501b`
- ✅ `CSRF_SECRET`: `3f3f5b5755429b2c160370fa47c9906ceb03a83f8eac746ee3afc15e6c664a42`
- ✅ `ENCRYPTION_KEY`: `0C1e7ooPkqFgljdAggFsExd5hk0tLRI8qI3o3YRI2qg=`
- ✅ `BACKUP_ENCRYPTION_KEY`: `Jinz1ToSG0kJBjSjlJ/LUfJFNBW+2+DfkHjrHFhbsZA=`

**No action needed** - these are already set and haven't been previously exposed.

---

## 🗑️ Step 6: Remove .env from Git History (CRITICAL!)

### **Option A: Using git filter-branch** (Recommended)

⚠️ **WARNING**: This rewrites git history. Coordinate with your team first!

```bash
# Backup your repository first
git clone <repo-url> ../asset-app-backup

# Remove .env from entire git history
cd /mnt/c/Users/Opiwe/OneDrive/Desktop/asset-app
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote (if you've already pushed)
git push origin --force --all
git push origin --force --tags

# Tell your team to re-clone the repository
```

### **Option B: Using BFG Repo-Cleaner** (Faster, Easier)

```bash
# Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
cd ..
git clone --mirror <your-repo-url> asset-app-mirror.git

# Remove .env
java -jar bfg.jar --delete-files .env asset-app-mirror.git

# Clean up and push
cd asset-app-mirror.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push
```

### **Option C: Start Fresh** (If repo is private and small)

If you haven't shared the repository widely:

```bash
# 1. Delete the current GitHub repository
# 2. Create a new repository
# 3. Initialize fresh git history:

rm -rf .git
git init
git add .
git commit -m "Initial commit (credentials removed)"
git branch -M main
git remote add origin <new-repo-url>
git push -u origin main
```

---

## 📝 Step 7: Update .gitignore (Already Done ✅)

Your `.gitignore` already includes:
```
.env
.env.local
.env.production
```

**Verify**:
```bash
cat .gitignore | grep .env
```

---

## 🔒 Step 8: Use Environment Variable Management

### **For Production**, use a secrets manager:

#### **Option 1: GitHub Secrets** (Free)
```bash
# In your GitHub repo:
# Settings → Secrets and variables → Actions → New repository secret

# Add each secret:
JWT_SECRET=<new_secret>
DATABASE_URL=<new_url>
WHATSAPP_ACCESS_TOKEN=<new_token>
# etc.
```

#### **Option 2: Vercel/Netlify Environment Variables**
```bash
# In Vercel dashboard:
# Project → Settings → Environment Variables

# Or via CLI:
vercel env add JWT_SECRET
```

#### **Option 3: AWS Secrets Manager** (Enterprise)
```bash
# Store secrets in AWS:
aws secretsmanager create-secret \
  --name asset-app/jwt-secret \
  --secret-string "<new_secret>"
```

#### **Option 4: Docker Secrets** (If using Docker in production)
```bash
# Create secrets:
echo "<new_secret>" | docker secret create jwt_secret -

# Use in docker-compose.yml:
secrets:
  jwt_secret:
    external: true
```

---

## ✅ Verification Checklist

After rotation, verify:

```bash
# 1. Test database connection
npm run dev
# Check console for "Database connected"

# 2. Test authentication
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# 3. Test WhatsApp API
curl https://graph.facebook.com/v21.0/me?access_token=<new_token>
# Should return: {"id":"..."}

# 4. Test email
node server/testEmail.mjs

# 5. Verify .env is not in git
git status
# Should NOT show server/.env as tracked
```

---

## 📊 Rotation Status Tracker

Use this checklist to track your progress:

- [ ] **JWT_SECRET** - Rotated
- [ ] **LOCAL_DATABASE_URL** - Password changed
- [ ] **NEON_DATABASE_URL** - Password changed
- [ ] **WHATSAPP_ACCESS_TOKEN** - Regenerated
- [ ] **WHATSAPP_APP_SECRET** - Retrieved from Meta
- [ ] **EMAIL_PASSWORD** - Regenerated
- [ ] **Git history cleaned** - .env removed
- [ ] **Production secrets configured** - Using secrets manager
- [ ] **All services tested** - Verified working
- [ ] **Team notified** - Everyone has new credentials

---

## 🚨 If Credentials Are Already Compromised

If you suspect your credentials have been accessed by unauthorized parties:

### **Immediate Actions**:

1. **Database**:
   ```bash
   # Check for unauthorized access
   SELECT * FROM "LoginHistory" WHERE success = true ORDER BY "createdAt" DESC LIMIT 50;

   # Look for suspicious IPs or unusual login times
   ```

2. **WhatsApp**:
   - Check Meta Developer Console for API usage spikes
   - Review message logs for unauthorized sends

3. **Email**:
   - Check Gmail "Recently used devices"
   - Review sent emails for unauthorized sends

4. **Actions**:
   - Immediately revoke all tokens
   - Force logout all users:
     ```sql
     DELETE FROM "RefreshToken";
     DELETE FROM "UserSession";
     ```
   - Enable 2FA for all admin accounts
   - Review audit logs:
     ```sql
     SELECT * FROM "SecurityEvent" WHERE severity IN ('high', 'critical');
     ```

---

## 📞 Need Help?

- **Meta Developer Support**: https://developers.facebook.com/support
- **Neon Support**: https://neon.tech/docs/introduction
- **GitHub Support**: https://support.github.com

---

## 🎯 Final Notes

**After completing all steps**:

1. ✅ All credentials have been rotated
2. ✅ .env has been removed from git history
3. ✅ Production uses a secrets manager
4. ✅ .gitignore prevents future commits
5. ✅ All services have been tested
6. ✅ Team has been notified

**Your application is now secure for production deployment!** 🎉

---

**Last Updated**: November 21, 2025
**Next Review**: Rotate credentials every 90 days
**Document Version**: 1.0
