# Complete WhatsApp Integration Setup Guide

## ✅ What's Already Done

1. **Access Token Updated**: New token is valid and working
2. **ngrok Running**: `https://prouniversity-catheryn-thistly.ngrok-free.dev`
3. **Webhook Subscribed**: "messages" field is subscribed in Meta
4. **Server Configured**: All environment variables set correctly

---

## 🔧 Final Setup Steps

### Step 1: Update Webhook URL in Meta Console

You need to point the webhook to your local server via ngrok:

1. Go to: https://developers.facebook.com/apps
2. Select your WhatsApp Business app
3. Navigate to: **Products → Webhooks**
4. Select product: **WhatsApp Business Account**
5. Click **Edit** next to Callback URL
6. **Update these values**:
   - **Callback URL**: `https://prouniversity-catheryn-thistly.ngrok-free.dev/api/whatsapp/webhook`
   - **Verify Token**: `asset_app_webhook_verify_2024`
7. Click **Verify and Save**

✅ It should verify successfully with a green checkmark!

---

## 📱 Testing WhatsApp Message Receiving

### Option 1: Send from Your Phone

Send a WhatsApp message **TO** your Business number:
- **Business Number**: +27 63 947 7702 (AssetPro)
- **Message**: "My laptop is broken"

**Requirements**:
- Your phone number must be in the database
- Current registered numbers:
  - +27 71 291 9486 (Kagiso)
  - +27 60 634 4230 (Jojo/Test User)

### Option 2: Test from Another User

If testing from a different phone:
1. Register the phone number in your app first
2. Or add it to an existing user's profile

---

## 🔍 What Should Happen

### Server Logs:
```
📩 Received webhook: {...}
📱 Message from: 27712919486, type: text
Message content: "My laptop is broken"
✅ Found user: Kagiso~
✅ Created ticket: TKT-00001
✅ Confirmation sent to 27712919486
```

### WhatsApp Reply:
```
✅ Ticket Created Successfully!

📋 Ticket #TKT-00001
📌 Title: My laptop is broken
⚡ Priority: medium
📊 Status: open

We've received your request and will get back to you soon!

🔗 Track your ticket: http://localhost:5173/tickets

Thank you for contacting us! 🙏
```

---

## 🚀 Sending Messages (Outbound)

### Method 1: Use the API Endpoint

Send via your server's API:

```bash
curl -X POST http://localhost:4000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumber": "27712919486",
    "message": "Hello! Your ticket has been updated."
  }'
```

### Method 2: Use Test Script

```bash
# Send text message to a specific number
node sendWhatsAppText.mjs
```

Edit `sendWhatsAppText.mjs` to change recipient and message.

### Method 3: Test via Admin Panel

Use the WhatsApp test endpoint in your admin dashboard.

---

## ⚠️ Common Issues and Solutions

### Issue 1: "Invalid parameter" Error

**Cause**: Phone number format issue or test number restrictions

**Solutions**:
1. Ensure phone number is in format: `27712919486` (no + or spaces)
2. Add test recipients in Meta Console:
   - Go to: WhatsApp → API Setup → "To" field
   - Click "+ Add phone number"
   - Enter the recipient's phone number
   - Verify via 6-digit code sent to their WhatsApp

### Issue 2: "Hello World template" Error

**Cause**: `hello_world` template only works with Meta's test numbers

**Solution**: Use text messages instead (already implemented in your code)

### Issue 3: "Re-engagement message" Error (Code 131047)

**Cause**: WhatsApp requires recipient to message you first within 24 hours

**Solution**:
- Have the recipient send you a message first
- OR use an approved message template
- After they message you, you have 24 hours to reply with any message

### Issue 4: No webhook received

**Checklist**:
- [ ] ngrok is running and URL is accessible
- [ ] Webhook URL updated in Meta Console
- [ ] "messages" field is subscribed
- [ ] Sender's phone number is in your database
- [ ] Message sent TO your business number (not FROM it)

---

## 📊 Current Configuration

```env
WHATSAPP_PHONE_NUMBER_ID=852483691285659
WHATSAPP_ACCESS_TOKEN=EAATRr7eNZB0YBP95Hdd... (Valid)
WHATSAPP_BUSINESS_ACCOUNT_ID=1554902325693975
WHATSAPP_API_VERSION=v21.0
WHATSAPP_VERIFY_TOKEN=asset_app_webhook_verify_2024
```

**Business Number**: +27 63 947 7702 (AssetPro)
**ngrok URL**: https://prouniversity-catheryn-thistly.ngrok-free.dev
**Webhook Endpoint**: /api/whatsapp/webhook

---

## 📝 Scripts Created

| Script | Purpose | Command |
|--------|---------|---------|
| `sendWhatsAppTemplate.mjs` | Send template message (hello_world) | `node sendWhatsAppTemplate.mjs` |
| `sendWhatsAppText.mjs` | Send plain text message | `node sendWhatsAppText.mjs` |
| `checkPhones.mjs` | List all users with phone numbers | `node checkPhones.mjs` |
| `diagnoseWhatsAppReceive.mjs` | Diagnostic tool for webhook setup | `node diagnoseWhatsAppReceive.mjs` |

---

## 🎯 Testing Checklist

Use this checklist to verify everything works:

### Receiving Messages (Inbound)

- [ ] ngrok is running
- [ ] Server is running (`npm run dev`)
- [ ] Webhook URL updated in Meta Console
- [ ] "messages" field subscribed
- [ ] Send "My laptop is broken" to +27 63 947 7702
- [ ] Check server logs for webhook
- [ ] Verify ticket created in database
- [ ] Receive confirmation message on WhatsApp

### Sending Messages (Outbound)

- [ ] Access token is valid (not expired)
- [ ] Recipient number is in correct format
- [ ] Recipient has messaged you first (within 24 hours)
- [ ] OR using approved message template
- [ ] Run test script: `node sendWhatsAppText.mjs`
- [ ] Check recipient's WhatsApp for message

---

## 🔐 Security Notes

1. **Access Token Expiry**:
   - Temporary tokens expire every 24 hours
   - For production, generate a System User Access Token (never expires)

2. **Webhook Security**:
   - Verify token must match exactly
   - Webhook URL must be HTTPS (ngrok provides this)
   - Validate incoming webhooks in production

3. **Phone Number Validation**:
   - Always sanitize and validate phone numbers
   - Store in consistent format in database

---

## 🚀 Next Steps

1. **Update webhook URL** in Meta Console (if not done)
2. **Send test message** to your business number
3. **Verify** ticket creation and reply
4. **Optional**: Generate permanent access token for production

---

## 💡 Pro Tips

1. **Keep ngrok running**: The URL changes when you restart ngrok (free tier)
2. **Monitor logs**: Watch server logs for webhook activity
3. **Test early**: Send test messages frequently during development
4. **Add phone numbers**: Ensure all test users have phone numbers in database
5. **Template messages**: Create and approve custom templates in Meta Console for rich messages

---

## 📞 Support

If you encounter issues:
1. Check server logs for errors
2. Run diagnostic: `node diagnoseWhatsAppReceive.mjs`
3. Verify configuration in `.env` file
4. Check Meta Developer Console for webhook status
5. Review ngrok logs: http://localhost:4040

---

## 📚 Additional Resources

- **Meta WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp
- **ngrok Dashboard**: http://localhost:4040
- **Your Guides**:
  - `META_WEBHOOK_SUBSCRIPTION_GUIDE.md`
  - `START_NGROK.md`
  - `FIND_WEBHOOK_SUBSCRIPTION.md`
