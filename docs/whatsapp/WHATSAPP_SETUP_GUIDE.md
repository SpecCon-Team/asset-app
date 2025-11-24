# WhatsApp Business API Setup Guide

This guide will help you set up WhatsApp Business API for your Asset Management System.

## Prerequisites

✅ You have:
- **Phone Number ID**: `852483691285659`
- **Business Account ID**: `1554902325693975`

⚠️ You still need:
- **Access Token** (Permanent Access Token from Meta)

---

## Step 1: Get Your Access Token

### Option A: Using Meta Business Suite (Recommended)

1. **Go to Meta for Developers**
   - Visit: https://developers.facebook.com
   - Log in with your Facebook/Meta account

2. **Access Your App**
   - Click "My Apps" in the top right
   - Select your WhatsApp Business API app
   - If you don't have an app, create one:
     - Click "Create App"
     - Choose "Business" as app type
     - Fill in app details

3. **Navigate to WhatsApp Product**
   - In your app dashboard, find "WhatsApp" in the left sidebar
   - Click "Getting Started" or "Configuration"

4. **Generate Access Token**
   - Find the "Temporary Access Token" section
   - Click "Generate Token" or "Copy Token"
   - ⚠️ **IMPORTANT**: This token expires in 24 hours!

5. **Create Permanent Access Token** (Recommended for Production)
   - Go to: https://business.facebook.com/settings/system-users
   - Click "Add" to create a System User
   - Give it a name (e.g., "WhatsApp API User")
   - Assign the System User to your app
   - Generate a token with these permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - **Save this token securely!**

### Option B: Using Graph API Explorer

1. Visit: https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Grant permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the token

---

## Step 2: Configure Your Server

### 2.1 Create or Update `.env` File

Navigate to your server directory and create/update the `.env` file:

```bash
cd server
cp .env.example .env  # If .env doesn't exist
```

### 2.2 Add WhatsApp Credentials

Open `server/.env` and add these lines:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID="852483691285659"
WHATSAPP_ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"
WHATSAPP_BUSINESS_ACCOUNT_ID="1554902025693975"
WHATSAPP_API_VERSION="v21.0"
```

**Replace `YOUR_ACCESS_TOKEN_HERE` with your actual access token!**

### 2.3 Verify Other Required Environment Variables

Make sure these are also configured in your `.env`:

```env
# Database
DATABASE_URL="your_database_url"

# JWT Secret
JWT_SECRET="your_jwt_secret"

# Email (for password reset)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Client URL
CLIENT_URL="http://localhost:5173"
PORT=4000
```

---

## Step 3: Restart Your Server

After updating the `.env` file, restart your server:

```bash
# If running in development
npm run dev

# Or if using pm2
pm2 restart asset-app-server
```

---

## Step 4: Test WhatsApp Integration

### Method 1: Using the Admin Dashboard (Easiest)

1. **Log in as Admin**
   - Open your app: http://localhost:5173
   - Log in with admin credentials

2. **Navigate to WhatsApp Setup**
   - Go to Settings → WhatsApp Setup
   - Or navigate directly to: http://localhost:5173/settings/whatsapp

3. **Check Connection Status**
   - The page should show: ✅ Connected

4. **Send Test Message**
   - Enter your phone number (include country code: +27712919486)
   - Click "Send Test Message"
   - Check your WhatsApp for the test message

### Method 2: Using API Directly (curl)

```bash
# Replace with your admin JWT token
TOKEN="your_jwt_token_here"
PHONE="+27712919486"

# Test connection
curl -X POST http://localhost:4000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"phoneNumber": "'$PHONE'"}'
```

---

## Step 5: Verify WhatsApp Number Registration

### Important: Your WhatsApp Number Must Be Registered!

Before you can send messages to a phone number, it must be:

1. **Added to your WhatsApp Business Account** (for testing)
2. **Or have business verification completed** (for production)

### For Testing (Sandbox Mode):

1. Go to: https://developers.facebook.com/apps/
2. Select your app → WhatsApp → Getting Started
3. Find "Send and receive messages" section
4. Add test phone numbers:
   - Click "Add phone number"
   - Enter the phone number (e.g., +27712919486)
   - Verify via WhatsApp
5. Once added, you can send messages to these numbers

### For Production:

1. Complete Meta Business Verification:
   - Go to: https://business.facebook.com/settings/info
   - Submit business documents
   - Wait for approval (can take 1-5 business days)

2. Get your messaging tier approved:
   - Start with Tier 1: 1,000 conversations/day
   - Increase by maintaining quality and completing verification

---

## Troubleshooting

### Error: "WhatsApp not configured"

**Solution**: Make sure your `.env` file has all three WhatsApp variables set:
```env
WHATSAPP_PHONE_NUMBER_ID="852483691285659"
WHATSAPP_ACCESS_TOKEN="your_token"
WHATSAPP_BUSINESS_ACCOUNT_ID="1554902025693975"
```

### Error: "Invalid access token"

**Solutions**:
1. Token expired → Generate a new permanent token
2. Token permissions insufficient → Make sure it has `whatsapp_business_messaging` permission
3. Copy-paste error → Verify no extra spaces in `.env` file

### Error: "Recipient phone number not registered"

**Solutions**:
1. Add the phone number to your test numbers (see Step 5)
2. Or complete business verification for production use

### Error: "(#131030) Recipient phone number not in allowed list"

**Solutions**:
1. Your app is in Development Mode
2. Add phone numbers to allowed list:
   - Go to: https://developers.facebook.com/apps/
   - Select your app → WhatsApp → Configuration
   - Add phone numbers under "Test phone numbers"

### Error: "Rate limit exceeded"

**Solutions**:
1. You're sending too many messages too quickly
2. Check your messaging tier limits
3. Wait a few minutes before retrying

---

## Phone Number Format

When sending messages, use international format:

✅ **Correct formats:**
- `+27712919486`
- `27712919486`
- `+1234567890`

❌ **Incorrect formats:**
- `0712919486` (missing country code)
- `(071) 291-9486` (spaces and special characters)

The API automatically formats numbers, but it's best to use the `+` format.

---

## API Endpoints

Your WhatsApp integration exposes these endpoints:

### Check Status
```bash
GET /api/whatsapp/status
```

### Send Test Message
```bash
POST /api/whatsapp/test
Body: { "phoneNumber": "+27712919486" }
```

### Send Custom Message
```bash
POST /api/whatsapp/send
Body: {
  "phoneNumber": "+27712919486",
  "message": "Hello from Asset App!"
}
```

### Send Ticket Notification
```bash
POST /api/whatsapp/notify/ticket
Body: {
  "phoneNumber": "+27712919486",
  "ticketData": {
    "ticketNumber": "TKT-001",
    "title": "Laptop not working",
    "priority": "high",
    "assignedTo": "John Doe"
  }
}
```

### Send Asset Notification
```bash
POST /api/whatsapp/notify/asset
Body: {
  "phoneNumber": "+27712919486",
  "assetData": {
    "assetCode": "AST-001",
    "assetName": "Dell Laptop",
    "assignedTo": "John Doe"
  }
}
```

---

## Next Steps

### Integrate WhatsApp Notifications into Your App

You can now integrate WhatsApp notifications into your ticket and asset workflows:

1. **Ticket Assignment Notifications**
   - Edit: `server/src/routes/tickets.ts`
   - Add WhatsApp notification when assigning tickets

2. **Asset Assignment Notifications**
   - Edit: `server/src/routes/assets.ts`
   - Add WhatsApp notification when assigning assets

3. **Comment Notifications**
   - Edit: `server/src/routes/comments.ts`
   - Add WhatsApp notification for new comments

**Example Integration:**

```typescript
import { whatsappService } from '../lib/whatsapp';

// In your ticket assignment code
if (user.phoneNumber) {
  await whatsappService.sendTicketNotification(user.phoneNumber, {
    ticketNumber: ticket.number,
    title: ticket.title,
    priority: ticket.priority,
    assignedTo: user.name
  });
}
```

---

## Security Best Practices

1. **Never commit your `.env` file to Git**
   - It's already in `.gitignore`
   - Never share your access token publicly

2. **Use permanent tokens for production**
   - Temporary tokens expire after 24 hours
   - System User tokens are more secure

3. **Store sensitive data securely**
   - Use environment variables
   - Consider using a secrets manager for production

4. **Monitor your WhatsApp usage**
   - Check Meta Business Suite regularly
   - Set up alerts for unusual activity

---

## Resources

- **Meta for Developers**: https://developers.facebook.com
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **Meta Business Suite**: https://business.facebook.com
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs: `npm run dev` output
3. Check Meta's Status Page: https://developers.facebook.com/status/
4. Review your app's error logs in Meta Business Suite

---

## Summary Checklist

- [ ] Got Phone Number ID: `852483691285659` ✅
- [ ] Got Business Account ID: `1554902025693975` ✅
- [ ] Generated permanent Access Token
- [ ] Updated `server/.env` with credentials
- [ ] Restarted server
- [ ] Tested connection via admin dashboard
- [ ] Added test phone numbers (for testing)
- [ ] Completed business verification (for production)
- [ ] Integrated WhatsApp notifications into app workflows

---

**🎉 Once all steps are complete, your WhatsApp Business API will be fully functional!**
