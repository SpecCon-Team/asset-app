# WhatsApp Bot Not Responding - Troubleshooting Guide

## Current Status: ✅ Code is Fixed, 🔧 Webhook Configuration Needed

Your server code is working correctly. The issue is the Meta WhatsApp configuration.

---

## Quick Diagnosis Checklist

Run through this checklist to find the problem:

### ✅ 1. Is Your Server Running?
```bash
# Check if server is running
lsof -i:4000
```
If nothing appears, start your server:
```bash
cd server
npm run dev
```

### ✅ 2. Is the Webhook URL Still Valid?

**If you're using ngrok or localtunnel:**
- The URL changes every time you restart it
- You need to update Meta dashboard every time

**Check your current public URL:**
```bash
# If using localtunnel - check the terminal where you ran it
# If using ngrok - check http://localhost:4040
```

### ✅ 3. Check Meta Dashboard Configuration

Go to: https://developers.facebook.com/apps

1. Select your WhatsApp app
2. Click **WhatsApp** → **Configuration**
3. Scroll to **Webhooks** section

**Check these things:**

#### A. Callback URL
Should look like:
```
https://your-public-url.com/api/whatsapp/webhook
```
or
```
https://abc123.loca.lt/api/whatsapp/webhook
```

**⚠️ Important:** Must end with `/api/whatsapp/webhook`

#### B. Verify Token
Must be EXACTLY:
```
asset_app_webhook_verify_2024
```

#### C. Webhook Status
Should show: **✅ Verified**

If it shows ❌ or "Not verified":
1. Click "Edit"
2. Re-enter the Callback URL and Verify Token
3. Click "Verify and Save"

#### D. Subscribed Fields
**CRITICAL:** You must be subscribed to **"messages"**

Look for a list of fields with checkboxes:
- ✅ **messages** ← THIS MUST BE CHECKED!

If not checked:
1. Check the "messages" box
2. Click "Save"

---

## Common Issues & Solutions

### Issue 1: "Webhook Not Verified" in Meta

**Cause:** Meta can't reach your webhook URL

**Solutions:**

1. **Check if your public URL is accessible:**
   ```bash
   curl https://YOUR_PUBLIC_URL/api/whatsapp/webhook
   ```
   Should return: `Forbidden` (this is normal, it means it's reachable)

2. **Check if your local server can be reached:**
   ```bash
   curl "http://localhost:4000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=asset_app_webhook_verify_2024&hub.challenge=test"
   ```
   Should return: `test`

3. **If using ngrok/localtunnel - make sure it's running:**
   ```bash
   # Terminal should show something like:
   # your url is: https://abc123.loca.lt
   ```

4. **Verify token mismatch:**
   Check your `.env` file:
   ```bash
   grep WHATSAPP_VERIFY_TOKEN .env
   ```
   Must match exactly what you entered in Meta dashboard

---

### Issue 2: Webhook Verified But Bot Not Responding

**Cause:** Not subscribed to "messages" field

**Solution:**

1. Go to Meta Dashboard → WhatsApp → Configuration
2. Scroll to Webhooks
3. Look for **"Webhook fields"** section
4. Make sure **"messages"** is checked ✅
5. Click "Save"

---

### Issue 3: Messages Create Tickets But No WhatsApp Reply

**Cause:** WhatsApp API credentials issue

**Test if sending works:**
```bash
curl -X POST http://localhost:4000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+27606344230"}'
```

**Possible issues:**
- Access token expired
- Phone number not verified in Meta (if in test mode)
- Wrong phone number ID

---

## Testing Steps

### Test 1: Local Webhook Test (Already Passed ✅)
```bash
cd server
node testWhatsAppFlow.mjs
```

### Test 2: Check Meta Can Reach Your Webhook
1. Go to Meta Dashboard
2. WhatsApp → Configuration → Webhooks
3. Click "Test" button next to your webhook
4. Check if it says "Success"

### Test 3: Send Real WhatsApp Message
1. Open WhatsApp on your phone
2. Send message to your business number: **"Hi"**
3. Watch your server logs (terminal running `npm run dev`)

**Expected logs:**
```
📩 Received webhook: {...}
📱 Processing message from: 27606344230
Looking for user with phone: 0606344230
✅ Found user: jojoopiwe@gmail.com (Jojo)
Parsed ticket: { title: 'Hi', description: 'Hi', priority: 'medium' }
✅ Created ticket: TKT-XXXXX
✅ Confirmation sent to 27606344230
```

If you see these logs, the bot is working!

### Test 4: Check for New Ticket
1. Go to your app dashboard
2. Check Tickets section
3. Should see a new ticket created by Jojo

---

## Step-by-Step Fix Guide

### If Using ngrok:

1. **Start ngrok** (if not already running):
   ```bash
   ~/bin/ngrok http 4000
   ```

2. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

3. **Update Meta Webhook:**
   - Go to: https://developers.facebook.com/apps
   - Your App → WhatsApp → Configuration
   - Webhooks → Edit
   - Callback URL: `https://abc123.ngrok.io/api/whatsapp/webhook`
   - Verify Token: `asset_app_webhook_verify_2024`
   - Click "Verify and Save"
   - Subscribe to "messages" ✅

4. **Test:**
   Send "Hi" to your WhatsApp business number

---

### If Using localtunnel:

1. **Start localtunnel** (if not already running):
   ```bash
   npx localtunnel --port 4000
   ```

2. **Copy the URL** (e.g., `https://abc123.loca.lt`)

3. **First time**: When you visit the URL, you'll see an IP confirmation page
   - Click "Continue"
   - This is required once per session

4. **Update Meta Webhook:**
   - Go to: https://developers.facebook.com/apps
   - Your App → WhatsApp → Configuration
   - Webhooks → Edit
   - Callback URL: `https://abc123.loca.lt/api/whatsapp/webhook`
   - Verify Token: `asset_app_webhook_verify_2024`
   - Click "Verify and Save"
   - Subscribe to "messages" ✅

5. **Test:**
   Send "Hi" to your WhatsApp business number

---

## Still Not Working?

Run the full diagnostic:
```bash
cd server
node diagnoseWhatsApp.mjs
```

Check server logs for errors:
```bash
# In the terminal running: npm run dev
# Look for any ❌ errors or warnings
```

---

## What Should Happen (Full Flow)

1. **You send WhatsApp:** "Hi"
2. **Meta receives it** on their servers
3. **Meta forwards to your webhook:** `POST https://your-url/api/whatsapp/webhook`
4. **Your server:**
   - Extracts phone: 27606344230
   - Finds user: Jojo (0606344230)
   - Creates ticket: TKT-XXXXX
   - Sends WhatsApp reply: "✅ Ticket Created Successfully..."
5. **You receive WhatsApp confirmation** on your phone
6. **Ticket appears in dashboard**

---

## Success Indicators

✅ Meta dashboard shows webhook "Verified"
✅ "messages" field is subscribed
✅ Server logs show incoming webhook requests
✅ New tickets appear in dashboard
✅ You receive WhatsApp confirmation messages

---

## Need More Help?

Share these details:
1. What you see in Meta webhook status
2. Your server logs when sending "Hi"
3. Whether tickets are being created
4. Whether you receive WhatsApp replies
