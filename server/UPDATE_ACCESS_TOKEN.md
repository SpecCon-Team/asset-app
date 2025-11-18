# 🔑 Update WhatsApp Access Token (EXPIRED)

## ✅ Good News!
Your webhook IS working! Messages are being received from Meta.

## ❌ The Issue
Your access token expired on **Monday, 17-Nov-25 12:00:00 PST**

This prevents the bot from sending replies back to customers.

---

## 🔧 How to Get a New Access Token

### Step 1: Go to Meta Developer Console

1. Open: **https://developers.facebook.com/apps**
2. Click on your WhatsApp Business app
3. In the left sidebar, click: **WhatsApp** → **API Setup**

### Step 2: Copy the Temporary Access Token

You'll see a section called **"Temporary access token"**

Look for something like:
```
┌─────────────────────────────────────────────┐
│ Temporary access token                      │
│ ─────────────────────────────────────────   │
│ EAATRr7eNZB0YBO95Hdd...                     │
│                                [Copy]       │
│                                             │
│ ⚠️ Expires in: 23 hours                     │
└─────────────────────────────────────────────┘
```

Click the **Copy** button to copy the new token.

⚠️ **Note:** This is a temporary token that expires in 24 hours. For production, you'll need to create a permanent token (System User Token).

### Step 3: Update Your .env File

**Option A: Automatic Update (Recommended)**

Run this command and paste your new token when prompted:

```bash
cd /mnt/c/Users/Opiwe/OneDrive/Desktop/asset-app/server
node updateAccessToken.mjs
```

**Option B: Manual Update**

1. Open the .env file:
```bash
nano server/.env
```

2. Find this line:
```
WHATSAPP_ACCESS_TOKEN="EAATRr7eNZB0YBP95HddNDb9bkVQl2..."
```

3. Replace with your new token:
```
WHATSAPP_ACCESS_TOKEN="EAATRr7eNZB0YBO_YOUR_NEW_TOKEN_HERE"
```

4. Save: Ctrl+O, Enter, Ctrl+X

### Step 4: Restart Your Server

The server should auto-restart with tsx watch, but if not:

```bash
# Stop current server (Ctrl+C in the terminal running npm run dev)
# Then restart:
npm run dev
```

---

## 🧪 Test Again

After updating the token:

1. Send **"Hi"** to your WhatsApp Business number
2. You should receive the interactive menu!

---

## 🔒 For Production: Create a Permanent Token

Temporary tokens expire every 24 hours. For production use, create a **System User Token**:

### Step-by-Step:

1. **Go to Meta Business Settings:** https://business.facebook.com/settings
2. **Select your business**
3. Click **Users** → **System Users** (in left sidebar)
4. Click **Add** to create a new system user
5. Give it a name: "WhatsApp Bot"
6. Assign role: **Admin**
7. Click **Add Assets** → Select your WhatsApp app
8. Toggle **Full Control**
9. Click **Generate New Token**
10. Select your app
11. Select permissions:
    - ✅ whatsapp_business_messaging
    - ✅ whatsapp_business_management
12. **Copy the token** (this never expires!)
13. Update your .env with this permanent token

---

## 📋 Summary

**Your webhook setup is PERFECT!** ✅

The only issue was the expired access token. Once you update it:
- Messages will be received ✅
- Bot will respond with interactive menu ✅
- Everything will work smoothly ✅

---

## Quick Commands

```bash
# Update token interactively
cd server
node updateAccessToken.mjs

# Or edit manually
nano server/.env

# Restart server (if needed)
npm run dev
```

Update the token now and test again! 🚀
