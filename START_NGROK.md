# How to Start ngrok and Configure WhatsApp Webhook

## Step 1: Start ngrok

Open a **NEW terminal window** (keep your server running in the current one) and run:

```bash
~/bin/ngrok http 4000
```

You'll see output like this:

```
ngrok

Session Status                online
Account                       Your Account (Plan: Free)
Version                       3.33.0
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:4000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**COPY THE HTTPS URL** - Example: `https://abc123xyz.ngrok.io`

⚠️ **IMPORTANT**:
- Keep this terminal window open while testing
- The URL changes each time you restart ngrok (unless you have a paid plan)
- Use the HTTPS URL (not HTTP)

---

## Step 2: Test Your Webhook Locally

Open another terminal and test if ngrok is working:

```bash
# Test the health endpoint
curl https://your-ngrok-url.ngrok.io/health

# Should return:
# {"status":"healthy","timestamp":"..."}
```

---

## Step 3: Configure in Meta Developer Console

### A. Go to Webhook Configuration

1. Open: https://developers.facebook.com/apps
2. Select your WhatsApp Business app
3. In left sidebar: **WhatsApp → Configuration**

### B. Edit Webhook Settings

Look for the **Webhook** section and click **Edit**:

**Callback URL**: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
- Example: `https://abc123xyz.ngrok.io/api/whatsapp/webhook`
- ⚠️ Make sure to include `/api/whatsapp/webhook` at the end!

**Verify Token**: `asset_app_webhook_verify_2024`

Click **Verify and Save**

### C. Subscribe to "messages" Field

After verification succeeds, scroll down to find **Webhook fields** section.

You should see a list like:
```
☐ account_alerts
☐ account_update
☐ messages                    [Subscribe]
☐ message_template_status_update
☐ phone_number_name_update
☐ phone_number_quality_update
```

**Click the [Subscribe] button next to "messages"**

It should change to:
```
☑ messages                    [Unsubscribe]
```

---

## Step 4: Update Your Access Token

You still need to update your expired access token!

1. In the same Meta app, go to: **WhatsApp → API Setup**
2. Find the **Temporary access token** section
3. Copy the token (starts with "EAAT...")
4. Run this command to update your .env:

```bash
# Open .env file
nano server/.env

# Find this line:
# WHATSAPP_ACCESS_TOKEN="EAATRr7eNZB0YBPx8HzV..."

# Replace with your new token
# Save: Ctrl+O, Enter, Ctrl+X
```

Or tell me the new token and I'll update it for you!

---

## Step 5: Restart Your Server

After updating the token:

```bash
# Your server should auto-restart with tsx watch
# But if not, restart it manually:
cd server
npm run dev
```

---

## Step 6: Test the Complete Flow

1. Send a WhatsApp message to your Business number: **"My laptop is broken"**

2. Watch your server terminal for logs:
```
📩 Received webhook: {...}
✅ Webhook object validated
📦 Processing 1 entries...
📱 Message from: +27712919486, type: text
Message content: "My laptop is broken"
✅ Found user: user@example.com
✅ Created ticket: TKT-00001
✅ Confirmation sent to +27712919486
```

3. You should receive a WhatsApp reply confirming ticket creation!

---

## Troubleshooting

### ngrok shows "ERR_NGROK_108"
- Your auth token might be invalid
- Run: `~/bin/ngrok config add-authtoken YOUR_AUTH_TOKEN`
- Get auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Webhook verification fails
- Check that ngrok is running
- Make sure server is running on port 4000
- Verify the URL is correct: `https://your-url.ngrok.io/api/whatsapp/webhook`
- Check the verify token matches: `asset_app_webhook_verify_2024`

### No logs when sending WhatsApp message
- Check that you subscribed to "messages" field
- Make sure ngrok is still running (URL is active)
- Verify access token is updated and valid
- Check if the phone number is registered in your database

### "No user found" error
- The phone number must exist in your database
- Check phone format in database matches WhatsApp format
- Run this to check: `node server/listAccounts.mjs`

---

## Quick Commands Summary

```bash
# Terminal 1: Start server (if not running)
cd server
npm run dev

# Terminal 2: Start ngrok
~/bin/ngrok http 4000

# Terminal 3: Test webhook
curl https://your-ngrok-url.ngrok.io/api/whatsapp/webhook

# Update access token
nano server/.env
```

---

## Alternative: Using localtunnel

If ngrok doesn't work, try localtunnel:

```bash
npx localtunnel --port 4000

# You'll get a URL like: https://xyz-123.loca.lt
# Use: https://xyz-123.loca.lt/api/whatsapp/webhook
```

⚠️ Note: localtunnel sometimes shows a warning page on first visit - click "Continue" to proceed.
