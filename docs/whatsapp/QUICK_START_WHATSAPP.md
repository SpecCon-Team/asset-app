# WhatsApp Quick Start - 3 Steps

## ✅ Status Check

- ✅ Access token: **UPDATED** (valid until tomorrow)
- ✅ ngrok running: `https://prouniversity-catheryn-thistly.ngrok-free.dev`
- ✅ Server running: Port 4000
- ✅ Webhook subscribed: "messages" field
- ⏳ Webhook URL: **NEEDS UPDATE**

---

## 🚀 3 Steps to Get WhatsApp Working

### Step 1: Update Webhook URL (2 minutes)

1. Go to: https://developers.facebook.com/apps
2. Your app → **Products → Webhooks**
3. Select: **WhatsApp Business Account**
4. Click **Edit** next to Callback URL
5. Paste: `https://prouniversity-catheryn-thistly.ngrok-free.dev/api/whatsapp/webhook`
6. Verify Token: `asset_app_webhook_verify_2024`
7. Click **Verify and Save** ✅

### Step 2: Test Receiving Messages (1 minute)

Send a WhatsApp message **TO**: **+27 63 947 7702**

**Message**: "My laptop is broken"

**From one of these numbers**:
- +27 71 291 9486 (Kagiso)
- +27 60 634 4230 (Jojo)

### Step 3: Verify It Worked

Check your server terminal for:
```
📩 Received webhook
✅ Created ticket: TKT-00001
✅ Confirmation sent
```

You should receive a WhatsApp reply with ticket details!

---

## 🎯 That's It!

Your WhatsApp bot is now ready to:
- ✅ Receive messages from users
- ✅ Automatically create tickets
- ✅ Send confirmation messages
- ✅ Track all conversations

---

## 📚 More Info

For detailed troubleshooting and advanced features, see:
- `WHATSAPP_COMPLETE_SETUP.md` - Full guide
- `START_NGROK.md` - ngrok setup details
- `META_WEBHOOK_SUBSCRIPTION_GUIDE.md` - Webhook configuration

---

## ⚠️ Important Notes

1. **ngrok URL changes** when you restart it (free tier)
   - If you restart ngrok, update the webhook URL again

2. **Access token expires** in 24 hours
   - Generate a permanent token for production use

3. **Phone numbers must be registered**
   - Users need phone numbers in the database to receive tickets

---

## 🔧 Quick Commands

```bash
# Check if ngrok is running
curl https://prouniversity-catheryn-thistly.ngrok-free.dev/health

# List users with phone numbers
node checkPhones.mjs

# Run diagnostics
node diagnoseWhatsAppReceive.mjs

# Send test message
node sendWhatsAppText.mjs
```

---

**Ready?** Go update that webhook URL and send your first message! 🚀
