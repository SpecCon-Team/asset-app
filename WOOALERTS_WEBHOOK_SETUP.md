# WooAlerts Webhook Setup Guide

This guide explains how to configure WooAlerts to send WhatsApp messages to your Asset Management System and automatically create tickets.

---

## 🎯 What This Does

When someone sends a WhatsApp message through WooAlerts, your system will:
1. ✅ Receive the message via webhook
2. ✅ Find or create a user account
3. ✅ Create a ticket automatically
4. ✅ Send confirmation back to the user on WhatsApp

---

## 📋 Prerequisites

- ✅ WooAlerts account configured
- ✅ WhatsApp Business API connected to WooAlerts
- ✅ Your server publicly accessible (for webhook)
- ✅ HTTPS enabled (WooAlerts requires HTTPS for webhooks)

---

## 🚀 Step-by-Step Setup

### Step 1: Get Your Webhook URL

Your webhook URL will be:

```
https://yourdomain.com/api/wooalerts-webhook
```

**For Local Development (Testing):**
If you're testing locally, you'll need to expose your localhost using one of these tools:

1. **Using ngrok** (Recommended):
   ```bash
   # Install ngrok
   npm install -g ngrok

   # Expose port 4000
   ngrok http 4000
   ```

   You'll get a URL like:
   ```
   https://abc123.ngrok.io
   ```

   Your webhook URL becomes:
   ```
   https://abc123.ngrok.io/api/wooalerts-webhook
   ```

2. **Using localtunnel**:
   ```bash
   npm install -g localtunnel
   lt --port 4000
   ```

3. **Using Cloudflare Tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```

**For Production:**
Use your actual domain:
```
https://yourdomain.com/api/wooalerts-webhook
```

---

### Step 2: Configure WooAlerts Webhook

1. **Log in to WooAlerts Dashboard**:
   - Go to: https://wooalerts.woosms.in/public/vendor-console/
   - Log in with your credentials

2. **Navigate to WhatsApp Settings**:
   - Click on "Settings"
   - Find "WhatsApp Cloud API Setup"
   - Or go directly to: https://wooalerts.woosms.in/public/vendor-console/settings/whatsapp-cloud-api-setup

3. **Enable Webhook**:
   - Find the option: **"Enable Webhook Endpoint"**
   - Toggle it to **ON**

4. **Enter Your Webhook URL**:
   - An input field should appear
   - Enter your webhook URL:
     ```
     https://yourdomain.com/api/wooalerts-webhook
     ```
   - Or for testing with ngrok:
     ```
     https://abc123.ngrok.io/api/wooalerts-webhook
     ```

5. **Save Configuration**:
   - Click "Save" or "Update"
   - WooAlerts will verify the webhook is accessible

---

### Step 3: Test the Webhook

#### Method 1: Using the Test Endpoint

Check if your webhook is accessible:

```bash
curl https://yourdomain.com/api/wooalerts-webhook/test
```

**Expected Response:**
```json
{
  "success": true,
  "message": "WooAlerts webhook endpoint is accessible",
  "timestamp": "2025-11-17T08:00:00.000Z",
  "endpoint": "/api/wooalerts-webhook"
}
```

#### Method 2: Test with Sample Data

Send a test webhook payload:

```bash
curl -X POST https://yourdomain.com/api/wooalerts-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+27712919486",
    "email": "john@example.com",
    "ticket": "My laptop screen is not working"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "ticketNumber": "TKT-00001",
    "ticketId": "clx...",
    "title": "My laptop screen is not working",
    "status": "open",
    "priority": "medium",
    "createdAt": "2025-11-17T08:00:00.000Z"
  }
}
```

#### Method 3: Send a Real WhatsApp Message

1. Send a WhatsApp message to your WooAlerts number
2. The message should include:
   - Your name
   - Your issue/request

**Example Message:**
```
My printer is not printing
```

Or structured format:
```
Title: Printer Issue
Description: HP printer not printing color pages
Priority: high
```

3. Check your app for the new ticket
4. You should receive a WhatsApp confirmation

---

## 📤 Webhook Payload Format

WooAlerts sends data in this format:

```json
{
  "name": "John Doe",
  "phone": "+27712919486",
  "email": "john@example.com",
  "ticket": "Description of the issue or request"
}
```

### Field Descriptions:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Optional | User's full name |
| `phone` | Optional* | Phone number (international format) |
| `email` | Optional* | User's email address |
| `ticket` | **Required** | Ticket description/issue |

*At least one of `phone` or `email` must be provided.

---

## 🔄 How It Works

### 1. Message Received
WooAlerts receives a WhatsApp message and forwards it to your webhook.

### 2. User Lookup/Creation
- System searches for existing user by email or phone
- If not found, creates a new user account automatically

### 3. Ticket Creation
- Parses the message to extract title and description
- Creates a new ticket in your system
- Assigns it to the user

### 4. Confirmation Sent
- Sends a WhatsApp confirmation with ticket number
- User can track their ticket

---

## 📝 Message Formats

### Simple Format (Recommended for Users)
Users can simply send their issue:

```
My laptop is not turning on
```

Result:
- **Title**: "My laptop is not turning on"
- **Description**: "My laptop is not turning on"
- **Priority**: medium

### Multi-line Format
First line becomes title, rest is description:

```
Laptop Issue
The laptop won't start. I tried charging it but nothing happens.
```

Result:
- **Title**: "Laptop Issue"
- **Description**: "The laptop won't start. I tried charging it but nothing happens."
- **Priority**: medium

### Structured Format (Advanced)
For more control:

```
Title: Urgent Printer Issue
Description: HP LaserJet printer not printing. Paper jam error.
Priority: high
```

Result:
- **Title**: "Urgent Printer Issue"
- **Description**: "HP LaserJet printer not printing. Paper jam error."
- **Priority**: high

---

## 🔧 Configuration Options

### Environment Variables

No additional environment variables needed! The webhook uses your existing WhatsApp configuration:

```env
# These should already be set from WhatsApp setup
WHATSAPP_PHONE_NUMBER_ID="852483691285659"
WHATSAPP_ACCESS_TOKEN="your_token"
WHATSAPP_BUSINESS_ACCOUNT_ID="1554902025693975"
CLIENT_URL="http://localhost:5173"  # For ticket links in confirmations
```

---

## 🔍 Monitoring & Logging

Check your server logs to monitor webhook activity:

```bash
# In development
npm run dev

# Look for log messages like:
# Received WooAlerts webhook: {...}
# Creating new user from WooAlerts webhook
# ✅ Created ticket TKT-00001 from WooAlerts webhook
# Sent confirmation to +27712919486
```

---

## 🚨 Troubleshooting

### Issue 1: Webhook Not Receiving Messages

**Symptoms:**
- No logs appearing in server
- No tickets being created

**Solutions:**
1. **Check webhook URL is correct**:
   ```bash
   curl https://yourdomain.com/api/wooalerts-webhook/test
   ```

2. **Verify server is accessible**:
   - If using ngrok, make sure it's still running
   - Check firewall settings
   - Ensure HTTPS is enabled

3. **Check WooAlerts configuration**:
   - Verify webhook is enabled
   - Correct URL entered
   - No typos in the URL

---

### Issue 2: User Not Found Error

**Error:**
```json
{
  "success": false,
  "error": "Either phone or email is required"
}
```

**Solutions:**
- Ensure WooAlerts is configured to send at least phone or email
- Check WooAlerts webhook payload format

---

### Issue 3: Ticket Created But No WhatsApp Confirmation

**Symptoms:**
- Ticket appears in system
- No WhatsApp message received

**Solutions:**
1. **Check WhatsApp API credentials**:
   ```bash
   # Test if WhatsApp is configured
   curl http://localhost:4000/api/whatsapp/status \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **Verify phone number format**:
   - Must include country code (+27)
   - No spaces or special characters

3. **Check server logs** for WhatsApp sending errors:
   ```
   Failed to send WhatsApp confirmation: ...
   ```

---

### Issue 4: Duplicate Users Being Created

**Symptoms:**
- Multiple users with same phone/email

**Solutions:**
- This shouldn't happen as the system checks for existing users
- Check server logs for errors during user lookup
- Verify database is accessible

---

## 📊 Testing Checklist

Use this checklist to verify your setup:

- [ ] Server is running (`npm run dev`)
- [ ] Webhook URL is accessible (test endpoint returns success)
- [ ] WooAlerts webhook is enabled
- [ ] Correct webhook URL entered in WooAlerts
- [ ] Sent test message via curl (ticket created)
- [ ] Sent real WhatsApp message (ticket created)
- [ ] Received WhatsApp confirmation
- [ ] Ticket appears in dashboard
- [ ] User account created/found correctly
- [ ] 🎉 Everything working!

---

## 🔒 Security Considerations

### 1. HTTPS Required
WooAlerts requires HTTPS for webhooks. Make sure your production server has:
- Valid SSL certificate
- HTTPS enabled
- No self-signed certificates

### 2. Webhook Authentication (Optional)
To add authentication to your webhook, you can:

1. **Add API key verification**:
   Edit `/server/src/routes/wooalerts.ts`:
   ```typescript
   const apiKey = req.headers['x-api-key'];
   if (apiKey !== process.env.WOOALERTS_API_KEY) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Add to .env**:
   ```env
   WOOALERTS_API_KEY="your_secret_key"
   ```

3. **Configure in WooAlerts**:
   Add the API key header in WooAlerts webhook settings

---

## 📈 Advanced Features

### Auto-Assignment to Technicians

To automatically assign tickets to available technicians, add this to the webhook handler:

```typescript
// In /server/src/routes/wooalerts.ts
// After creating the ticket

// Find an available technician
const technician = await prisma.user.findFirst({
  where: {
    role: 'TECHNICIAN',
    // Add logic to find least busy technician
  }
});

if (technician) {
  await prisma.ticket.update({
    where: { id: newTicket.id },
    data: { assignedToId: technician.id }
  });

  // Notify technician via WhatsApp
  if (technician.phoneNumber) {
    await whatsappService.sendTicketNotification(
      technician.phoneNumber,
      {
        ticketNumber: newTicket.number,
        title: newTicket.title,
        priority: newTicket.priority
      }
    );
  }
}
```

---

## 📱 Example User Flow

1. **User sends WhatsApp message**:
   ```
   "My office laptop screen is flickering"
   ```

2. **WooAlerts forwards to your webhook**:
   ```json
   {
     "name": "Jane Smith",
     "phone": "+27712919486",
     "email": "jane@example.com",
     "ticket": "My office laptop screen is flickering"
   }
   ```

3. **Your system processes it**:
   - Finds/creates user "Jane Smith"
   - Creates ticket TKT-00042
   - Sends confirmation

4. **User receives WhatsApp**:
   ```
   ✅ Ticket Created Successfully!

   Ticket #TKT-00042
   Title: My office laptop screen is flickering
   Priority: medium
   Status: open

   We've received your request and will get back to you soon.

   You can track your ticket at: https://yourdomain.com/tickets/clx...
   ```

5. **Admin sees ticket in dashboard**:
   - New ticket appears
   - Can be assigned to technician
   - Tracked and resolved

---

## 🎯 Quick Reference

### Webhook URL
```
https://yourdomain.com/api/wooalerts-webhook
```

### Test Endpoint
```
https://yourdomain.com/api/wooalerts-webhook/test
```

### Required Payload Fields
- `ticket` (required)
- `phone` or `email` (at least one)

### Supported Priority Levels
- `low`
- `medium` (default)
- `high`
- `critical`

---

## ✅ Summary

You've successfully set up WooAlerts webhook integration! Now your users can:
- Send WhatsApp messages to create tickets
- Receive instant confirmations
- Track their requests easily

Your system automatically:
- Creates/finds user accounts
- Generates tickets
- Sends confirmations
- Tracks everything

**Need help?** Check the troubleshooting section or review your server logs for detailed error messages.
