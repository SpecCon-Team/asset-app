# Meta WhatsApp Webhook Setup - Complete Guide

This guide shows you how to configure Meta WhatsApp Business API to send incoming messages directly to your system, which will automatically create tickets.

---

## 🎯 What This Does

When someone sends a WhatsApp message to your business number:
1. ✅ Meta forwards the message to your webhook
2. ✅ Your system finds the user by phone number
3. ✅ Automatically creates a ticket
4. ✅ Sends confirmation back to the user on WhatsApp

**No third-party services needed!** Direct integration with Meta.

---

## 📋 Prerequisites

- ✅ WhatsApp Business API credentials (you already have these!)
- ✅ Server publicly accessible via HTTPS
- ✅ Domain or ngrok for webhook URL

---

## 🚀 Step-by-Step Setup

### Step 1: Expose Your Server (Choose One)

#### Option A: Production (Recommended)

Your webhook URL will be:
```
https://yourdomain.com/api/whatsapp/webhook
```

**Requirements:**
- Valid domain
- HTTPS/SSL certificate
- Server accessible from internet

#### Option B: Development/Testing with ngrok

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   ```

2. **Start your server**:
   ```bash
   cd server
   npm run dev
   ```

3. **In a new terminal, start ngrok**:
   ```bash
   ngrok http 4000
   ```

4. **Copy the HTTPS URL** (looks like: `https://abc123.ngrok.io`)

5. **Your webhook URL**:
   ```
   https://abc123.ngrok.io/api/whatsapp/webhook
   ```

⚠️ **Important**: Keep ngrok running while testing!

---

### Step 2: Configure Meta Webhook

1. **Go to Meta Developers**:
   ```
   https://developers.facebook.com/apps
   ```

2. **Select your WhatsApp app**

3. **Find WhatsApp in the left sidebar** → Click **"Configuration"**

4. **Scroll to "Webhooks" section**

5. **Click "Edit"** or **"Configure Webhooks"**

6. **Enter your webhook details**:

   **Callback URL**:
   ```
   https://yourdomain.com/api/whatsapp/webhook
   ```
   Or with ngrok:
   ```
   https://abc123.ngrok.io/api/whatsapp/webhook
   ```

   **Verify Token**:
   ```
   asset_app_webhook_verify_2024
   ```
   ⚠️ This **MUST MATCH** the `WHATSAPP_VERIFY_TOKEN` in your `.env` file!

7. **Click "Verify and Save"**

8. **Subscribe to webhook fields**:
   - Check the box for **"messages"**
   - This tells Meta to send incoming messages to your webhook

9. **Click "Save"**

---

### Step 3: Test the Webhook

#### Test 1: Verification

Check if Meta verified your webhook:
- You should see "✅ Webhook verified successfully!" in your server logs
- If verification failed, check:
  - Webhook URL is correct
  - Verify token matches `.env` file
  - Server is accessible

#### Test 2: Send a WhatsApp Message

1. **Make sure a user has phone number in system**:
   - Log in to your app as admin
   - Go to Users
   - Edit a user and add phone number: `+27712919486`
   - Save

2. **Send WhatsApp message to your business number**:
   ```
   My laptop is not working
   ```

3. **Check server logs**:
   ```
   📩 Received webhook: {...}
   📱 Processing message from: 27712919486
   ✅ Found user: user@example.com
   ✅ Created ticket: TKT-00001
   ✅ Confirmation sent to 27712919486
   ```

4. **User receives WhatsApp**:
   ```
   ✅ Ticket Created Successfully!

   📋 Ticket #TKT-00001
   📌 Title: My laptop is not working
   ⚡ Priority: medium
   📊 Status: open

   We've received your request and will get back to you soon!
   ```

5. **Check your dashboard**:
   - New ticket should appear
   - Assigned to the user

---

## 📱 Message Formats

### Simple Format (Recommended)
```
My printer is not working
```
Result:
- Title: "My printer is not working"
- Description: "My printer is not working"
- Priority: medium

### Multi-line Format
```
Network Issue
The office Wi-Fi keeps disconnecting every 5 minutes
```
Result:
- Title: "Network Issue"
- Description: "The office Wi-Fi keeps disconnecting every 5 minutes"
- Priority: medium

### Structured Format
```
Title: Urgent Server Issue
Description: Main server is down. All services affected.
Priority: critical
```
Result:
- Title: "Urgent Server Issue"
- Description: "Main server is down. All services affected."
- Priority: critical

---

## 🔧 Environment Variables

Make sure these are in your `server/.env`:

```env
# WhatsApp API Credentials
WHATSAPP_PHONE_NUMBER_ID="852483691285659"
WHATSAPP_ACCESS_TOKEN="your_access_token"
WHATSAPP_BUSINESS_ACCOUNT_ID="1554902025693975"
WHATSAPP_API_VERSION="v21.0"

# Webhook Verify Token (must match Meta dashboard)
WHATSAPP_VERIFY_TOKEN="asset_app_webhook_verify_2024"

# Your app URL (for ticket links in confirmations)
CLIENT_URL="http://localhost:5173"
```

---

## 🔍 How It Works

### 1. User Sends Message
User sends WhatsApp message to your business number:
```
"My laptop screen is broken"
```

### 2. Meta Forwards to Your Webhook
Meta sends POST request to:
```
https://yourdomain.com/api/whatsapp/webhook
```

With payload:
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "from": "27712919486",
          "type": "text",
          "text": {
            "body": "My laptop screen is broken"
          }
        }]
      }
    }]
  }]
}
```

### 3. Your System Processes It
1. Extracts phone number: `27712919486`
2. Finds user in database by phone
3. Parses message:
   - Title: "My laptop screen is broken"
   - Description: "My laptop screen is broken"
   - Priority: medium
4. Creates ticket in database
5. Generates ticket number: `TKT-00042`

### 4. Confirmation Sent
System sends WhatsApp message back:
```
✅ Ticket Created Successfully!

📋 Ticket #TKT-00042
📌 Title: My laptop screen is broken
⚡ Priority: medium
📊 Status: open

We've received your request and will get back to you soon!

🔗 Track your ticket: https://yourdomain.com/tickets

Thank you for contacting us! 🙏
```

---

## 🚨 Troubleshooting

### Issue 1: Webhook Verification Failed

**Error in Meta dashboard**: "Webhook verification failed"

**Solutions**:

1. **Check verify token matches**:
   - In `.env`: `WHATSAPP_VERIFY_TOKEN="asset_app_webhook_verify_2024"`
   - In Meta dashboard: Enter exactly: `asset_app_webhook_verify_2024`
   - No spaces, case-sensitive!

2. **Check webhook URL is accessible**:
   ```bash
   curl https://yourdomain.com/api/whatsapp/webhook/test
   ```

3. **Check server is running**:
   ```bash
   npm run dev
   ```

4. **If using ngrok**:
   - Make sure ngrok is still running
   - URL hasn't changed (ngrok URLs change when restarted)

---

### Issue 2: Messages Not Creating Tickets

**Symptoms**: Message received but no ticket created

**Check server logs for errors:**

```bash
# Look for these log messages:
📩 Received webhook: {...}
📱 Processing message from: 27712919486
```

**Common causes:**

1. **User not found**:
   ```
   ❌ No user found with phone: 27712919486
   ```
   **Solution**: Add phone number to user profile in your app

2. **Phone number mismatch**:
   - User in database: `+27 71 291 9486`
   - WhatsApp sends: `27712919486`
   - System matches last 10 digits
   - Make sure user's phone has at least the last 10 digits correct

3. **Database error**:
   ```
   ❌ Error processing message: Prisma error...
   ```
   **Solution**: Check database is running

---

### Issue 3: User Doesn't Receive Confirmation

**Symptoms**: Ticket created but no WhatsApp reply

**Solutions**:

1. **Check WhatsApp API credentials**:
   ```bash
   # Test if sending works
   curl -X POST http://localhost:4000/api/whatsapp/test \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+27712919486"}'
   ```

2. **Check phone number is verified as test number** (if in development mode)

3. **Check access token hasn't expired**:
   - Temporary tokens expire after 24 hours
   - Generate new token or create permanent token

---

### Issue 4: Webhook Receives Duplicate Messages

**Symptoms**: Same message creates multiple tickets

**This is normal!** Meta may send duplicate webhooks.

**Solutions** (optional, advanced):

Add message deduplication:
```typescript
// Track processed message IDs
const processedMessages = new Set();

if (processedMessages.has(message.id)) {
  console.log('Duplicate message, skipping');
  return;
}

processedMessages.add(message.id);
// ... process message
```

---

## 📊 Monitoring

### Server Logs

Watch your server logs to monitor webhook activity:

```bash
npm run dev
```

Look for:
```
✅ Webhook verified successfully!
📩 Received webhook: {...}
📱 Processing message from: 27712919486
✅ Found user: user@example.com (John Doe)
✅ Created ticket: TKT-00001
✅ Confirmation sent to 27712919486
```

### Meta Dashboard

Check webhook status in Meta:
1. Go to WhatsApp → Configuration
2. Scroll to Webhooks
3. Check for:
   - ✅ Verified
   - ✅ Subscribed to "messages"

---

## 🔒 Security Considerations

### 1. Verify Token Security
- Use a strong, random verify token
- Don't share it publicly
- Change it if compromised

### 2. Webhook Signature Verification (Optional, Advanced)

Meta signs webhook requests. You can verify them:

```typescript
// Add to webhook handler
const signature = req.headers['x-hub-signature-256'];
const expectedSignature = crypto
  .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
  .update(req.rawBody)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  return res.sendStatus(403);
}
```

### 3. Rate Limiting

The app already has rate limiting enabled globally.

---

## 🎯 Testing Checklist

Use this to verify your setup:

- [ ] Server running (`npm run dev`)
- [ ] Ngrok running (if testing locally)
- [ ] Webhook URL entered in Meta dashboard
- [ ] Verify token matches `.env` file
- [ ] Meta webhook shows "✅ Verified"
- [ ] Subscribed to "messages" field
- [ ] User has phone number in database
- [ ] Sent test WhatsApp message
- [ ] Server logs show message received
- [ ] Ticket created in database
- [ ] Ticket appears in admin dashboard
- [ ] User received WhatsApp confirmation
- [ ] 🎉 Everything working!

---

## 📈 Advanced Features

### Auto-Assign to Technicians

To automatically assign incoming tickets:

Edit `/server/src/routes/whatsapp.ts` after ticket creation:

```typescript
// Find available technician
const technician = await prisma.user.findFirst({
  where: {
    role: 'TECHNICIAN',
    // Add logic: least busy, specific department, etc.
  }
});

if (technician) {
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { assignedToId: technician.id }
  });

  // Notify technician
  if (technician.phoneNumber) {
    await whatsappService.sendTicketNotification(
      technician.phoneNumber,
      {
        ticketNumber: ticket.number,
        title: ticket.title,
        priority: ticket.priority
      }
    );
  }
}
```

### Support for Images/Documents

To handle image/document messages:

```typescript
if (messageType === 'image') {
  const imageUrl = message.image.url;
  // Download and attach to ticket
}

if (messageType === 'document') {
  const documentUrl = message.document.url;
  // Download and attach to ticket
}
```

---

## 🔗 Quick Reference

### Webhook URLs

**Production**:
```
https://yourdomain.com/api/whatsapp/webhook
```

**Development (ngrok)**:
```
https://abc123.ngrok.io/api/whatsapp/webhook
```

### Verify Token
```
asset_app_webhook_verify_2024
```

### Meta Configuration URL
```
https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/
```

### Server Logs Location
```
Terminal running: npm run dev
```

---

## ✅ Success!

You've successfully set up direct WhatsApp Business API integration!

**Your users can now**:
- Send WhatsApp messages to create tickets
- Receive instant confirmations
- Track their tickets

**Your system automatically**:
- Receives messages from Meta
- Finds/validates users
- Creates tickets
- Sends confirmations
- Logs everything

**No WooAlerts or other third-party needed!** 🎉

---

## 📞 Need Help?

1. Check server logs for detailed error messages
2. Review Meta's webhook documentation
3. Test with simple messages first
4. Verify all credentials are correct

---

## 🎊 Next Steps

1. **Add more users** with phone numbers
2. **Test different message formats**
3. **Set up auto-assignment** to technicians
4. **Configure notifications** for admins
5. **Move to production** with permanent token

Your direct Meta WhatsApp integration is ready! 🚀
