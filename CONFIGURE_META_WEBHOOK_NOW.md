# ⚠️ URGENT: Configure Meta WhatsApp Webhook

Your webhook is NOT receiving messages from Meta because it's not configured yet.

## 🚨 Why Your Bot Isn't Responding

When you send "Hi" to your WhatsApp Business number:
1. ✅ Your phone sends message to Meta's servers
2. ❌ Meta doesn't know where to send the webhook (not configured)
3. ❌ Your server never receives the message
4. ❌ Bot can't respond

---

## 📋 Step-by-Step: Configure Webhook RIGHT NOW

### Step 1: Open Meta Developer Console

1. Go to: **https://developers.facebook.com/apps**
2. Log in with your Facebook account
3. Click on your WhatsApp Business app

### Step 2: Navigate to Configuration

In the left sidebar, find and click:
**WhatsApp** → **Configuration**

You should see a page with:
- Phone numbers
- Webhook settings
- API Setup

### Step 3: Edit Webhook

Look for the **"Webhook"** section and click the **"Edit"** button.

You'll see two fields:

**Callback URL:** Enter this EXACT URL:
```
https://prouniversity-catheryn-thistly.ngrok-free.dev/api/whatsapp/webhook
```

**Verify Token:** Enter this EXACT token:
```
asset_app_webhook_verify_2024
```

Click **"Verify and Save"**

✅ You should see: **"Webhook verified successfully"**

⚠️ If verification fails, check:
- URL is exactly as shown above (no extra spaces)
- ngrok is still running
- Server is running on port 4000

### Step 4: Subscribe to Messages Field

After verification succeeds, scroll down on the same page.

You'll see a section called **"Webhook fields"** with a list:

```
☐ account_alerts
☐ account_update
☐ messages                    [Subscribe]
☐ message_template_status_update
☐ phone_number_name_update
☐ phone_number_quality_update
```

**IMPORTANT:** Click the **[Subscribe]** button next to **"messages"**

It should change to:
```
☑ messages                    [Unsubscribe]
```

### Step 5: Test Again

Now send "Hi" to your WhatsApp Business number: **+27639477702**

You should:
1. See webhook logs in your server terminal
2. Receive the interactive menu reply

---

## 🔍 How to Verify It's Working

### Check ngrok Dashboard
Open in browser: **http://127.0.0.1:4040**

You should see:
- Requests coming in from Meta
- POST requests to `/api/whatsapp/webhook`

### Check Server Logs
Your terminal should show:
```
📩 Received webhook: {...}
📱 Processing message from: 27639477702
✅ User: Kagiso (admin@example.com)
```

---

## ❌ Troubleshooting

### "Webhook verification failed"

**Possible causes:**
1. ngrok stopped running → Restart: `~/bin/ngrok http 4000`
2. Server crashed → Check terminal for errors
3. Wrong URL → Copy-paste the exact URL above
4. Wrong token → Use exactly: `asset_app_webhook_verify_2024`

**Fix:**
```bash
# Check if ngrok is running
curl http://127.0.0.1:4040/api/tunnels

# Check if server is running
curl http://localhost:4000/health

# Test webhook manually
curl "https://prouniversity-catheryn-thistly.ngrok-free.dev/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=asset_app_webhook_verify_2024&hub.challenge=test"
# Should output: test
```

### "Can't find Webhook section"

Make sure you're in the right place:
1. Facebook Developer Console
2. Your WhatsApp Business App
3. Left sidebar: **WhatsApp** → **Configuration**
4. NOT "API Setup" - different section!

### Messages still not coming through

1. ✅ Verify webhook is configured (check the URL in Meta)
2. ✅ Verify "messages" field is subscribed (should show checkmark)
3. ✅ Check your access token is not expired
4. ✅ Make sure you're sending FROM a different number TO your business number

---

## 📸 Visual Guide

### What the Configuration Page Looks Like:

**Webhook Section:**
```
┌─────────────────────────────────────────┐
│ Webhook                        [Edit]    │
├─────────────────────────────────────────┤
│ Callback URL:                           │
│ https://prouniversity...webhook         │
│                                         │
│ Verify Token: ****                      │
│                                         │
│             [Verify and Save]           │
└─────────────────────────────────────────┘
```

**Webhook Fields Section:**
```
┌─────────────────────────────────────────┐
│ Webhook fields                          │
├─────────────────────────────────────────┤
│ ☐ account_alerts                        │
│ ☐ account_update                        │
│ ☑ messages              [Unsubscribe]   │  ← Should be checked!
│ ☐ message_template_status_update        │
│ ☐ phone_number_name_update              │
└─────────────────────────────────────────┘
```

---

## 🎯 Quick Checklist

Before testing, verify ALL of these:

- [ ] ngrok is running: `~/bin/ngrok http 4000`
- [ ] Server is running: `npm run dev` in server folder
- [ ] Webhook URL configured in Meta
- [ ] Webhook verified successfully (green checkmark)
- [ ] "messages" field is SUBSCRIBED (checkmark visible)
- [ ] Your access token is valid (not expired)

---

## 🆘 Still Not Working?

If you've done all the above and it still doesn't work:

### Option 1: Check Access Token
Your access token might be expired. Go to:
**WhatsApp** → **API Setup** → Copy new temporary access token

Update your `.env`:
```bash
WHATSAPP_ACCESS_TOKEN="your_new_token_here"
```

### Option 2: Use Webhook Testing Tool
In Meta Developer Console:
1. Go to **WhatsApp** → **Configuration**
2. Find "Test Button" near webhook section
3. Click to send test webhook
4. Check if it arrives in your server logs

### Option 3: Check Meta App Status
Verify your app is not in "Development Mode" restrictions that block webhooks.

---

## ✅ Success Indicators

You'll know it's working when:

1. **In Meta Dashboard:**
   - ✅ Webhook shows green checkmark
   - ✅ "messages" field is subscribed

2. **In ngrok Dashboard (http://127.0.0.1:4040):**
   - ✅ POST requests to `/api/whatsapp/webhook`
   - ✅ 200 OK responses

3. **In Server Logs:**
   - ✅ "📩 Received webhook"
   - ✅ "✅ User found"
   - ✅ "✅ Confirmation sent"

4. **In WhatsApp:**
   - ✅ Bot replies with interactive menu
   - ✅ Responses are immediate (within 1-2 seconds)

---

## 📞 Your Configuration Summary

```
Webhook URL: https://prouniversity-catheryn-thistly.ngrok-free.dev/api/whatsapp/webhook
Verify Token: asset_app_webhook_verify_2024
Business Number: +27639477702
Subscribe Field: messages ✅
```

---

## 🚀 After Configuration

Once webhook is configured and subscribed:

1. Send **"Hi"** to +27639477702
2. Wait 1-2 seconds
3. You should receive the menu:

```
👋 Welcome!

How can I help you today?

Please reply with a number:

1️⃣ Create a Support Ticket
2️⃣ Check My Tickets Status
3️⃣ General Enquiry
4️⃣ Report an Issue
5️⃣ Contact Support Team
```

---

**Configure the webhook now and test again!** 🎊
