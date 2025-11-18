# WhatsApp Cloud API - Complete Step-by-Step Setup Guide

This guide walks you through setting up WhatsApp Cloud API from Meta for your Asset Management System.

---

## ✅ What You Already Have

- **Phone Number ID**: `852483691285659` ✅
- **Business Account ID**: `1554902025693975` ✅
- **Access Token**: Added to `.env` ✅
- **Server Configuration**: Complete ✅

---

## 📋 Step-by-Step Setup Process

### Step 1: Access Meta Developers Console

1. **Open your browser** and go to:
   ```
   https://developers.facebook.com/apps
   ```

2. **Log in** with your Facebook account

3. **Find your WhatsApp app** in the list
   - You should see the app that has the credentials above
   - Click on it to open the app dashboard

---

### Step 2: Configure WhatsApp Product

1. In the left sidebar, find and click **"WhatsApp"**

2. Click **"Getting Started"** or **"API Setup"**

3. You should see:
   - ✅ Your Phone Number ID: `852483691285659`
   - ✅ Your Access Token (the one you provided)
   - ✅ Your Business Account ID: `1554902025693975`

---

### Step 3: Add Test Phone Number (CRITICAL!)

**This is the most important step!** Without this, you cannot receive messages.

1. **In the WhatsApp section**, look for:
   - "Send and receive messages" section
   - Or "Configuration" tab
   - Or "Test numbers" section

2. **Click "Add phone number"** or "Manage phone number list"

3. **Enter your phone number**: `+27712919486`
   - ⚠️ Must include the country code (+27)
   - Must be in international format
   - No spaces or special characters

4. **Verify the number**:
   - Meta will send a verification code to WhatsApp
   - Open WhatsApp on your phone
   - You'll receive a message with a code
   - Enter the code in Meta's dashboard

5. **Confirmation**:
   - Once verified, `+27712919486` will appear in your test numbers list
   - Status should show "Active" or "Verified"

---

### Step 4: Understanding Your Setup

#### A. Development Mode vs Production Mode

**Current Status: Development Mode**

In Development Mode:
- ✅ Free to use
- ✅ Can send messages to test numbers only
- ❌ Cannot send to any phone number
- ⚠️ Test numbers must be verified (Step 3)

To enable Production Mode:
- Complete Meta Business Verification
- Submit business documents
- Wait 1-5 business days for approval
- Once approved, can send to any phone number

#### B. Access Token Types

**You have: Temporary Access Token**
- ⏰ Expires in 24 hours
- 🔧 Good for testing
- ❌ Not suitable for production

**For Production: System User Token (Permanent)**
- ♾️ Never expires
- 🔒 More secure
- ✅ Recommended for production

How to create a permanent token (Optional for now):
1. Go to: https://business.facebook.com/settings/system-users
2. Click "Add" → Create system user
3. Name it (e.g., "WhatsApp API User")
4. Assign to your app
5. Generate token with permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. Copy and save the token
7. Update in `server/.env`

---

### Step 5: Test Your Setup

#### Method 1: Using the Admin Dashboard (Easiest)

1. **Start your server**:
   ```bash
   cd server
   npm run dev
   ```

   Wait until you see:
   ```
   Server running on http://localhost:4000
   ✅ Database connected successfully
   ```

2. **Start your client** (in a new terminal):
   ```bash
   cd client
   npm run dev
   ```

   Wait until you see:
   ```
   Local: http://localhost:5173
   ```

3. **Open your browser**:
   ```
   http://localhost:5173
   ```

4. **Log in as Admin**:
   - Use your admin email and password

5. **Navigate to WhatsApp Setup**:
   - Click your profile picture (top right)
   - Click "Settings" or "General Settings"
   - Look for "WhatsApp Setup" in the sidebar
   - Or go directly to: `http://localhost:5173/settings/whatsapp`

6. **Check Status**:
   - You should see: ✅ **Connected**
   - Phone Number ID: `852483691285659`
   - Business Account ID: `1554902025693975`

7. **Send Test Message**:
   - In the "Test Phone Number" field, enter: `+27712919486`
   - Click "Send Test Message"
   - Wait 2-5 seconds
   - **Check your WhatsApp!**

8. **Expected Result**:
   You should receive a WhatsApp message that says:
   ```
   ✅ WhatsApp Connection Test

   This is a test message from your Asset Management System.

   If you receive this message, your WhatsApp Business API is configured correctly!
   ```

#### Method 2: Using curl (Advanced)

1. **First, get your JWT token**:
   - Log in to your app as admin
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Copy the value of `token`

2. **Test the API**:
   ```bash
   # Replace YOUR_TOKEN with the actual JWT token
   curl -X POST http://localhost:4000/api/whatsapp/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"phoneNumber": "+27712919486"}'
   ```

3. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Test message sent successfully",
     "data": {
       "messaging_product": "whatsapp",
       "contacts": [...],
       "messages": [...]
     }
   }
   ```

---

### Step 6: Troubleshooting Common Issues

#### Issue 1: "Recipient phone number not in allowed list"

**Error Message:**
```json
{
  "error": "(#131030) Recipient phone number not in allowed list"
}
```

**Solution:**
- Your app is in Development Mode
- You must add `+27712919486` as a test number (see Step 3)
- Go to: https://developers.facebook.com/apps/ → Your App → WhatsApp → Configuration
- Add the phone number and verify it

---

#### Issue 2: "Invalid access token"

**Error Message:**
```json
{
  "error": "Invalid OAuth access token"
}
```

**Solutions:**
1. **Token expired** (after 24 hours):
   - Go to: https://developers.facebook.com/apps/
   - Your App → WhatsApp → Getting Started
   - Click "Generate new token"
   - Copy the new token
   - Update `server/.env` file
   - Restart server

2. **Token copied incorrectly**:
   - Check `server/.env` file
   - Make sure there are no extra spaces
   - Make sure the entire token is copied
   - Format should be:
     ```env
     WHATSAPP_ACCESS_TOKEN="EAATRr7eNZ..."
     ```

3. **Wrong permissions**:
   - Token must have `whatsapp_business_messaging` permission
   - Regenerate token with correct permissions

---

#### Issue 3: "WhatsApp not configured"

**Error Message:**
```json
{
  "configured": false,
  "message": "WhatsApp Business API is not configured"
}
```

**Solutions:**
1. Check `server/.env` file has all variables:
   ```env
   WHATSAPP_PHONE_NUMBER_ID="852483691285659"
   WHATSAPP_ACCESS_TOKEN="your_token_here"
   WHATSAPP_BUSINESS_ACCOUNT_ID="1554902025693975"
   WHATSAPP_API_VERSION="v21.0"
   ```

2. Restart your server:
   ```bash
   cd server
   npm run dev
   ```

3. Check for typos in variable names

---

#### Issue 4: No message received on WhatsApp

**Possible Causes:**

1. **Phone number not verified as test number**
   - Solution: Complete Step 3 above

2. **Phone number format wrong**
   - ❌ Wrong: `0712919486`
   - ❌ Wrong: `27712919486`
   - ✅ Correct: `+27712919486`

3. **WhatsApp not installed or connected**
   - Make sure WhatsApp is installed on your phone
   - Make sure you have internet connection
   - Check if WhatsApp is using the same number

4. **Meta API delays**
   - Sometimes messages take 10-30 seconds
   - Check WhatsApp again after waiting
   - Check for internet connectivity issues

---

#### Issue 5: Rate limit exceeded

**Error Message:**
```json
{
  "error": "Rate limit exceeded"
}
```

**Solutions:**
- You're sending too many messages too quickly
- Wait 1-2 minutes before trying again
- In development, rate limit is ~10 messages per minute

---

### Step 7: Next Steps - Integrating into Your App

Once testing is successful, you can integrate WhatsApp notifications into your workflows:

#### A. Ticket Assignment Notification

When assigning a ticket to a user, send them a WhatsApp notification.

**Example Integration in `server/src/routes/tickets.ts`:**

```typescript
import { whatsappService } from '../lib/whatsapp';

// In your ticket assignment code
if (assignedUser.phoneNumber) {
  await whatsappService.sendTicketNotification(
    assignedUser.phoneNumber,
    {
      ticketNumber: ticket.number,
      title: ticket.title,
      priority: ticket.priority,
      assignedTo: assignedUser.name
    }
  );
}
```

#### B. Asset Assignment Notification

When assigning an asset to a user.

**Example:**

```typescript
if (user.phoneNumber) {
  await whatsappService.sendAssetNotification(
    user.phoneNumber,
    {
      assetCode: asset.asset_code,
      assetName: asset.name,
      assignedTo: user.name
    }
  );
}
```

#### C. Comment Notifications

Notify users when someone comments on their ticket.

---

### Step 8: Moving to Production

When ready for production:

1. **Complete Business Verification**:
   - Go to: https://business.facebook.com/settings/info
   - Submit required documents:
     - Business registration
     - Tax documents
     - Proof of address
   - Wait for approval (1-5 business days)

2. **Create Permanent Access Token**:
   - Follow instructions in Step 4B
   - Update `server/.env` with new token

3. **Request Message Template Approval**:
   - WhatsApp requires pre-approved templates for marketing messages
   - Service messages (notifications) can be sent freely within 24 hours of user interaction

4. **Remove Test Numbers Restriction**:
   - Once verified, you can send to any phone number
   - No need to add each number as a test number

5. **Monitor Usage**:
   - Check Meta Business Suite regularly
   - Monitor message delivery rates
   - Watch for any policy violations

---

## 🎯 Quick Reference

### Your Credentials
```env
WHATSAPP_PHONE_NUMBER_ID="852483691285659"
WHATSAPP_ACCESS_TOKEN="EAATRr7eNZB0YB..." (in .env file)
WHATSAPP_BUSINESS_ACCOUNT_ID="1554902025693975"
```

### Important URLs
- **Meta Developers**: https://developers.facebook.com/apps
- **Business Manager**: https://business.facebook.com
- **WhatsApp Setup**: http://localhost:5173/settings/whatsapp

### API Endpoints
- Status: `GET /api/whatsapp/status`
- Test: `POST /api/whatsapp/test`
- Send: `POST /api/whatsapp/send`
- Ticket Notify: `POST /api/whatsapp/notify/ticket`
- Asset Notify: `POST /api/whatsapp/notify/asset`

### Phone Number Format
✅ Correct: `+27712919486`
❌ Wrong: `0712919486`, `27712919486`

---

## 📞 Support

If you encounter issues not covered here:

1. Check server logs: `npm run dev` output
2. Check browser console: F12 → Console
3. Review Meta's status: https://developers.facebook.com/status/
4. Check your app's error logs in Meta Business Suite

---

## ✅ Setup Checklist

Use this checklist to ensure everything is set up:

- [ ] Logged into Meta Developers (https://developers.facebook.com/apps)
- [ ] Found my WhatsApp app in the dashboard
- [ ] Located WhatsApp product in sidebar
- [ ] Verified Phone Number ID: `852483691285659`
- [ ] Verified Business Account ID: `1554902025693975`
- [ ] Access token added to `server/.env`
- [ ] Added `+27712919486` as test number
- [ ] Verified phone number via WhatsApp code
- [ ] Phone number shows as "Active" in test numbers
- [ ] Server started successfully (`npm run dev`)
- [ ] Client started successfully (`npm run dev`)
- [ ] Logged in as admin
- [ ] Navigated to WhatsApp Setup page
- [ ] Status shows "✅ Connected"
- [ ] Sent test message to `+27712919486`
- [ ] Received test message on WhatsApp
- [ ] 🎉 WhatsApp API is working!

---

**🎉 Congratulations! Your WhatsApp Business API is now set up and ready to use!**
