# 🔒 Create Permanent WhatsApp Access Token

## Why You Need This

**Current Situation:**
- Your temporary token expires every 24 hours
- You have to manually update `.env` file daily
- Bot stops working when token expires

**With Permanent Token:**
- ✅ Token NEVER expires
- ✅ Set it once, forget about it
- ✅ Production-ready solution
- ✅ No daily maintenance needed

---

## 📋 Step-by-Step: Create System User Token

### Step 1: Access Meta Business Settings

1. Go to: **https://business.facebook.com/settings**
2. Log in with your Facebook account
3. **Select your business** from the dropdown (top-left)

### Step 2: Navigate to System Users

In the left sidebar, find and click:
**Users** → **System Users**

(If you don't see this, make sure you have admin access to the business account)

### Step 3: Create a System User

1. Click the **"Add"** button (usually blue, top-right)
2. **Name:** Enter a name like "WhatsApp Bot" or "Support System"
3. **Role:** Select **Admin** (required for WhatsApp API access)
4. Click **"Create System User"**

### Step 4: Assign WhatsApp App to System User

1. Find your newly created system user in the list
2. Click on the system user name to open details
3. Click **"Add Assets"** button
4. Select **"Apps"** from the dropdown
5. Find and select your WhatsApp Business app
6. Toggle **"Full Control"** to ON
7. Click **"Save Changes"**

### Step 5: Generate the Permanent Token

1. Still on the system user page, click **"Generate New Token"** button
2. **Select your WhatsApp app** from the dropdown
3. **Set token expiration:** Select **"Never"** or **"60 days"** (recommended: Never)
4. **Select permissions:** Check these boxes:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
   - ✅ `business_management` (optional, but recommended)

5. Click **"Generate Token"**

### Step 6: Copy and Save the Token

⚠️ **IMPORTANT:** This is the ONLY time you'll see this token!

1. A popup will show your permanent access token
2. Click **"Copy"** button
3. **SAVE IT IMMEDIATELY** in a secure place:
   - Password manager (recommended)
   - Secure notes app
   - `.env` file (be careful not to commit to git)

Example token format:
```
EABCDef1234567890_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

---

## 🔧 Update Your .env File

### Option 1: Use the Update Script

```bash
cd /mnt/c/Users/Opiwe/OneDrive/Desktop/asset-app/server
node updateAccessToken.mjs
```

When prompted, paste your permanent token.

### Option 2: Manual Update

1. Open `.env` file:
```bash
nano server/.env
```

2. Find this line:
```
WHATSAPP_ACCESS_TOKEN="EAATRr7eNZB0YBP2GuC..."
```

3. Replace with your permanent token:
```
WHATSAPP_ACCESS_TOKEN="YOUR_PERMANENT_TOKEN_HERE"
```

4. Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### Option 3: Direct Command

```bash
# Replace YOUR_TOKEN_HERE with your actual token
sed -i 's/WHATSAPP_ACCESS_TOKEN=".*"/WHATSAPP_ACCESS_TOKEN="YOUR_TOKEN_HERE"/' server/.env
```

---

## ✅ Verify It Works

1. **Restart your server:**
```bash
# The server should auto-restart with tsx watch
# But if not, restart manually:
npm run dev
```

2. **Test the bot:**
   - Send "Hi" to your WhatsApp Business number
   - You should receive the menu

3. **Check token never expires:**
   - Go back to Meta Business Settings → System Users
   - Click on your system user
   - Under "Access Tokens", you should see "Never expires"

---

## 🔒 Security Best Practices

### DO:
✅ Store token in `.env` file
✅ Add `.env` to `.gitignore`
✅ Use environment variables in production
✅ Keep token in password manager as backup
✅ Restrict access to your Meta Business account

### DON'T:
❌ Commit token to git repository
❌ Share token publicly
❌ Hard-code token in source code
❌ Send token via email/chat
❌ Store in unsecured documents

---

## 📊 Token Comparison

| Feature | Temporary Token | System User Token |
|---------|----------------|-------------------|
| **Expires** | 24 hours | Never (or 60+ days) |
| **Setup** | Easy | Medium |
| **Production Ready** | ❌ No | ✅ Yes |
| **Maintenance** | Daily updates | None |
| **Best For** | Testing | Production |

---

## 🆘 Troubleshooting

### "I don't see System Users option"

**Solution:** You need admin access to the Meta Business account.
1. Ask the business owner to add you as admin
2. Or ask them to create the system user for you

### "Token still expires"

**Check:**
1. Did you select "Never" for expiration?
2. Did you use System User Token (not temporary token)?
3. Go to Business Settings → System Users → Your user → Tokens to verify

### "Invalid token error"

**Solutions:**
1. Make sure you copied the entire token
2. Check for spaces at beginning/end
3. Generate a new token if needed

### "Permissions error"

**Solution:**
1. Go back to System User
2. Check that your WhatsApp app has "Full Control"
3. Regenerate token with correct permissions

---

## 🔄 If You Need to Regenerate Token

If you lose your token or need a new one:

1. Go to Business Settings → System Users
2. Click on your system user
3. Under "Access Tokens" section
4. Click **"Generate New Token"**
5. Select your app and permissions
6. Copy the new token
7. Update your `.env` file

⚠️ **Note:** Old token will be revoked when you generate new one.

---

## 📝 Production Deployment Tips

When deploying to production:

### Use Environment Variables

Most hosting platforms (Heroku, AWS, Render, etc.) support environment variables:

```bash
# Set environment variable
WHATSAPP_ACCESS_TOKEN=your_permanent_token_here
```

### Docker Deployment

```dockerfile
# docker-compose.yml
environment:
  - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
```

### PM2 Deployment

```bash
# Use ecosystem.config.js
module.exports = {
  apps: [{
    name: 'whatsapp-bot',
    script: './dist/index.js',
    env: {
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN
    }
  }]
}
```

---

## ✅ Success Checklist

- [ ] Created system user in Meta Business Settings
- [ ] Assigned WhatsApp app to system user
- [ ] Generated permanent token with correct permissions
- [ ] Copied and saved token securely
- [ ] Updated `.env` file with new token
- [ ] Restarted server
- [ ] Tested bot (sent "Hi" and received response)
- [ ] Verified token shows "Never expires" in Meta

---

## 🎉 Benefits of Permanent Token

Once set up:
- ✅ Bot works 24/7 without interruption
- ✅ No daily maintenance needed
- ✅ No manual token updates
- ✅ Production-ready setup
- ✅ Peace of mind
- ✅ Professional deployment

---

## 📞 Quick Reference

**Meta Business Settings:** https://business.facebook.com/settings
**Path:** Users → System Users → Create → Generate Token
**Permissions Needed:** `whatsapp_business_messaging`, `whatsapp_business_management`
**Expiration:** Select "Never"

---

**Set this up once and forget about daily token updates!** 🚀
