# WhatsApp Webhook Testing Guide - Step by Step

Follow these exact steps to test your WhatsApp webhook integration.

---

## ✅ Step 1: Start Your Server

1. **Open Terminal** (or Command Prompt)

2. **Navigate to server folder**:
   ```bash
   cd /mnt/c/Users/Opiwe/OneDrive/Desktop/asset-app/server
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

4. **Wait for confirmation** - You should see:
   ```
   Server running on http://localhost:4000
   ✅ Database connected successfully
   ```

**✅ Success!** Leave this terminal open and running.

---

## ✅ Step 2: Expose Your Server with ngrok

Since Meta needs to reach your server via HTTPS, we'll use ngrok.

1. **Open a NEW Terminal** (keep the first one running!)

2. **Install ngrok** (if not installed):
   ```bash
   npm install -g ngrok
   ```

3. **Start ngrok**:
   ```bash
   ngrok http 4000
   ```

4. **You'll see output like this**:
   ```
   Session Status    online
   Account           Your Name
   Version           3.x.x
   Region            United States (us)
   Forwarding        https://abc123def456.ngrok.io -> http://localhost:4000
   ```

5. **Copy the HTTPS URL** (the one that starts with `https://`)
   - Example: `https://abc123def456.ngrok.io`
   - **You'll need this for Step 3!**

**✅ Success!** Leave ngrok running.

---

## ✅ Step 3: Configure Meta Webhook

1. **Open browser** and go to:
   ```
   https://developers.facebook.com/apps
   ```

2. **Log in** with your Facebook account

3. **Find and click your WhatsApp app** (the one with your credentials)

4. **In the left sidebar**, find and click **"WhatsApp"**

5. **Click "Configuration"** or **"Settings"**

6. **Scroll down to find "Webhooks"** section

7. **Click "Edit"** or **"Configure webhooks"**

8. **Enter your webhook details**:

   **Callback URL**:
   ```
   https://abc123def456.ngrok.io/api/whatsapp/webhook
   ```
   ⚠️ Replace `abc123def456.ngrok.io` with YOUR ngrok URL from Step 2!

   **Verify Token**:
   ```
   asset_app_webhook_verify_2024
   ```
   ⚠️ Copy this EXACTLY - no spaces!

9. **Click "Verify and Save"**

10. **You should see**: ✅ Verified

11. **Subscribe to webhook fields**:
    - Find the "Webhook fields" section
    - Check the box for **"messages"**
    - Click "Subscribe"

12. **Save changes**

**✅ Success!** Your webhook is now connected to Meta.

---

## ✅ Step 4: Prepare a Test User

You need a user with a phone number in your system.

1. **Open browser** and go to:
   ```
   http://localhost:5173
   ```

2. **Log in as Admin**
   - Use your admin credentials

3. **Go to Users page**:
   - Click "Users" in the sidebar
   - Or go to: `http://localhost:5173/users`

4. **Find or create a test user**:
   - Click "Edit" on an existing user
   - Or create a new user

5. **Add phone number**:
   - Find the "Phone Number" field
   - Enter: `+27712919486`
   - Or use your own phone number

6. **Click "Save"**

**✅ Success!** User is ready to receive messages.

---

## ✅ Step 5: Send Test WhatsApp Message

Now the exciting part - send a real WhatsApp message!

1. **Open WhatsApp** on your phone

2. **Send a message to your WhatsApp Business number**

   Simple message:
   ```
   My laptop is not working
   ```

   Or structured message:
   ```
   Title: Urgent Laptop Issue
   Description: Laptop won't turn on after Windows update
   Priority: high
   ```

3. **Wait 2-5 seconds**

---

## ✅ Step 6: Check the Results

### Check 1: Server Logs

Look at your **first terminal** (where server is running).

You should see:
```
📩 Received webhook: {...}
📱 Processing message from: 27712919486
Message type: text
Message content: "My laptop is not working"
Looking for user with phone: 712919486
✅ Found user: user@example.com (John Doe)
Parsed ticket: {...}
✅ Created ticket: TKT-00001
✅ Confirmation sent to 27712919486
```

**If you see this - SUCCESS!** ✅

### Check 2: WhatsApp Reply

Check your **WhatsApp** - you should receive:
```
✅ Ticket Created Successfully!

📋 Ticket #TKT-00001
📌 Title: My laptop is not working
⚡ Priority: medium
📊 Status: open

We've received your request and will get back to you soon!

🔗 Track your ticket: http://localhost:5173/tickets

Thank you for contacting us! 🙏
```

**If you receive this - SUCCESS!** ✅

### Check 3: Dashboard

1. **Go to your browser** (logged in as admin)

2. **Click "Tickets"** in sidebar

3. **You should see** the new ticket:
   - Ticket #TKT-00001
   - Title: "My laptop is not working"
   - Status: Open
   - Priority: Medium

**If you see the ticket - SUCCESS!** ✅

---

## 🎉 Congratulations!

If all 3 checks passed, your WhatsApp webhook is working perfectly!

**Your system can now**:
- ✅ Receive WhatsApp messages
- ✅ Create tickets automatically
- ✅ Send confirmations to users

---

## ❌ Troubleshooting

### Problem 1: "Webhook verification failed" in Meta

**Check**:
1. Server is running (`npm run dev`)
2. ngrok is running (`ngrok http 4000`)
3. Webhook URL is correct: `https://YOUR_NGROK_URL/api/whatsapp/webhook`
4. Verify token is EXACTLY: `asset_app_webhook_verify_2024`

**Solution**:
```bash
# Test webhook is accessible
curl https://YOUR_NGROK_URL/api/whatsapp/webhook
```

---

### Problem 2: No logs in server terminal

**Check**:
1. Did you send message to the correct WhatsApp number?
2. Is webhook subscribed to "messages" in Meta?
3. Is ngrok still running?

**Solution**:
- Check ngrok terminal - it should show incoming requests
- If ngrok URL changed, update it in Meta dashboard

---

### Problem 3: "No user found" error

**Server logs show**:
```
❌ No user found with phone: 27712919486
```

**Solution**:
1. Go to Users in your app
2. Edit the user
3. Add phone number: `+27712919486`
4. Make sure it includes country code
5. Save user
6. Try sending WhatsApp message again

---

### Problem 4: Ticket not appearing in dashboard

**Check**:
1. Are you logged in as admin?
2. Refresh the page
3. Check "All Tickets" not just "My Tickets"

**Solution**:
- Go to: `http://localhost:5173/tickets`
- Click "Refresh" or reload page

---

## 🔄 Testing Different Message Formats

Once basic test works, try these:

### Test 1: Simple Message
```
Printer not working
```

### Test 2: Multi-line
```
Network Issue
Wi-Fi keeps disconnecting every few minutes
```

### Test 3: Structured
```
Title: Critical Server Down
Description: Main server is not responding. All services affected.
Priority: critical
```

### Test 4: Long Message
```
I need help with my computer. It's been running very slowly lately and sometimes freezes completely. I've tried restarting it multiple times but the problem persists. Can someone please help?
```

---

## 📝 Quick Command Reference

### Start Server
```bash
cd /mnt/c/Users/Opiwe/OneDrive/Desktop/asset-app/server
npm run dev
```

### Start ngrok
```bash
ngrok http 4000
```

### Kill port 4000
```bash
lsof -ti:4000 | xargs kill -9
```

### Check if server is running
```bash
curl http://localhost:4000/health
```

### Test webhook
```bash
curl https://YOUR_NGROK_URL/api/whatsapp/webhook
```

---

## ✅ Success Checklist

- [ ] Server running on port 4000
- [ ] ngrok running and showing HTTPS URL
- [ ] Webhook configured in Meta dashboard
- [ ] Webhook verified (✅ in Meta)
- [ ] Subscribed to "messages" field
- [ ] User has phone number in database
- [ ] Sent test WhatsApp message
- [ ] Received webhook logs in server
- [ ] Received WhatsApp confirmation
- [ ] Ticket appears in dashboard
- [ ] 🎉 **EVERYTHING WORKING!**

---

## 🚀 What's Next?

Once testing is successful:

1. **Add more users** with phone numbers
2. **Test with different phones**
3. **Configure auto-assignment** to technicians
4. **Set up permanent webhook** (when deploying to production)
5. **Create permanent access token** (temporary tokens expire in 24 hours)

---

## 📞 Need More Help?

If something doesn't work:

1. **Check server logs** (first terminal) for error messages
2. **Check ngrok logs** (second terminal) for incoming requests
3. **Check Meta webhook logs** in Meta dashboard
4. **Review the error message** carefully
5. **Try the troubleshooting section** above

---

**Good luck with testing! 🎊**
