# 🤖 WhatsApp Bot Testing Guide

## ✅ **Bot Configuration Status**

Your WhatsApp bot is **FULLY CONFIGURED** with:
- ✅ Phone Number ID: `852483691285659`
- ✅ Access Token: Configured
- ✅ Business Account ID: `1554902925693975`
- ✅ Webhook: Ready to receive messages
- ✅ Interactive Menu: Implemented

---

## 🎯 **How the Bot Works**

The WhatsApp bot has an **interactive menu system** that responds to user messages automatically:

### **Main Menu Options:**
When a user sends a message, they receive:

```
👋 Welcome [Name]!

How can I help you today?

Please reply with a number:

1️⃣ Create a Support Ticket
2️⃣ Check My Tickets Status
3️⃣ General Enquiry
4️⃣ Report an Issue
5️⃣ Contact Support Team

Type the number of your choice (1-5)
```

---

## 📱 **Testing the WhatsApp Bot**

### **Method 1: Send a Message to Your WhatsApp Business Number**

1. **Find your WhatsApp Business Phone Number**:
   - Go to: https://business.facebook.com/latest/whatsapp_manager
   - Look for your test number

2. **Send a message** from your personal WhatsApp to the business number:
   - Try: "Hello"
   - Try: "MENU"
   - Try: "Help"

3. **Expected Response**:
   - The bot should immediately respond with the main menu
   - You'll be auto-created as a user if you don't exist

### **Method 2: Using the API Endpoint**

You can test sending messages using the API:

```bash
# Replace with your admin token
curl -X POST http://localhost:4000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "phoneNumber": "+27712919486",
    "message": "Hello from the asset management system!"
  }'
```

---

## 🎮 **Interactive Bot Features**

### **1. Create a Support Ticket (Option 1)**
- User types: `1`
- Bot asks for ticket description
- User describes the issue
- Bot creates ticket automatically
- User receives confirmation with ticket number

### **2. Check Ticket Status (Option 2)**
- User types: `2`
- Bot shows last 5 tickets with:
  - Ticket number
  - Title
  - Status (🟢 open, 🟡 in progress, ✅ resolved)
  - Priority

### **3. General Enquiry (Option 3)**
- User types: `3`
- Bot asks for enquiry details
- Creates low-priority ticket
- Team gets notified

### **4. Report an Issue (Option 4)**
- User types: `4`
- Bot asks for issue details
- Creates high-priority ticket
- Urgent response

### **5. Contact Support (Option 5)**
- User types: `5`
- Bot shows contact information:
  - Email
  - Phone
  - Website
  - Support hours

---

## 🔄 **Conversation Flow Example**

### Example 1: Creating a Ticket
```
User: Hi
Bot: 👋 Welcome John!

     How can I help you today?

     1️⃣ Create a Support Ticket
     2️⃣ Check My Tickets Status
     3️⃣ General Enquiry
     4️⃣ Report an Issue
     5️⃣ Contact Support Team

User: 1

Bot: 📝 Create Support Ticket

     Please describe your issue or request in detail.

     You can include:
     • What's the problem?
     • When did it start?
     • Any error messages?

User: My laptop is not turning on

Bot: ✅ Ticket Created Successfully!

     📋 Ticket #TKT-00042
     📌 Title: My laptop is not turning on
     ⚡ Priority: MEDIUM
     📊 Status: OPEN

     We've received your request and our team will get back to you soon!

     Type MENU to return to main menu.
```

### Example 2: Checking Ticket Status
```
User: 2

Bot: 📋 Your Recent Tickets

     🟢 TKT-00042
        My laptop is not turning on
        Status: OPEN
        Priority: MEDIUM

     ✅ TKT-00035
        Internet connection issue
        Status: RESOLVED
        Priority: HIGH

     Type MENU to return to main menu.
```

---

## 🛠️ **Testing Steps**

### **Step 1: Verify Webhook is Working**
```bash
# Check if webhook is accessible
curl http://localhost:4000/api/whatsapp/webhook
```

### **Step 2: Check WhatsApp Configuration**
```bash
# Test WhatsApp status
curl -X GET http://localhost:4000/api/whatsapp/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Step 3: Send Test Message**
Send a WhatsApp message to your business number from your personal phone

### **Step 4: Check Server Logs**
Watch the server console for:
- `📩 Received webhook:`
- `📱 Message from: [number]`
- `✅ User: [email]`
- Message processing logs

---

## 🔍 **Debugging**

### **If Bot Doesn't Respond:**

1. **Check Server is Running**:
   ```bash
   # Make sure server is running
   npm run dev
   ```

2. **Check Webhook Configuration**:
   - Go to Meta Developer Console
   - Verify webhook URL is set
   - Ensure webhook is subscribed to messages

3. **Check Logs**:
   ```bash
   # Watch server logs
   tail -f server/logs/app.log
   ```

4. **Verify Phone Number Format**:
   - Must include country code
   - Example: `+27712919486` (South Africa)
   - No spaces or special characters

5. **Check Access Token**:
   ```bash
   # Verify token is valid
   cd server
   cat .env | grep WHATSAPP_ACCESS_TOKEN
   ```

---

## 🚀 **Advanced Features**

### **Auto-User Creation**
- When someone messages for the first time
- Bot automatically creates a user account
- Email: `whatsapp_[timestamp]@temp.local`
- Role: USER
- Marked as WhatsApp user

### **Conversation State Management**
- Bot remembers conversation context
- State expires after 30 minutes of inactivity
- Type `MENU` to reset and start over

### **Notifications**
- When ticket is created via WhatsApp
- All admins and technicians get notified
- In-app notifications
- Can be extended to email/SMS

---

## 📊 **Testing Checklist**

- [ ] Server is running (http://localhost:4000)
- [ ] WhatsApp credentials configured in `.env`
- [ ] Webhook URL is accessible publicly (use ngrok if local)
- [ ] Webhook is subscribed in Meta Developer Console
- [ ] Send test message to business number
- [ ] Bot responds with main menu
- [ ] Test creating a ticket (option 1)
- [ ] Verify ticket appears in dashboard
- [ ] Test checking tickets (option 2)
- [ ] Test all menu options (1-5)
- [ ] Verify notifications are created

---

## 🌐 **Making Webhook Public (for Local Testing)**

If testing locally, you need to expose your server:

### **Using ngrok:**
```bash
# Install ngrok
# Download from: https://ngrok.com/download

# Start ngrok
ngrok http 4000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update Meta webhook URL to: https://abc123.ngrok.io/api/whatsapp/webhook
```

### **Webhook Configuration in Meta:**
1. Go to: https://developers.facebook.com
2. Select your app
3. Go to WhatsApp > Configuration
4. Edit webhook
5. Enter: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
6. Enter verify token: `asset_app_webhook_verify_2024`
7. Subscribe to `messages` field

---

## ✅ **Expected Behavior**

### **When You Send "Hi" or "Hello":**
```
✅ Bot receives message
✅ Finds or creates user
✅ Sends main menu with 5 options
✅ Waits for user choice
```

### **When You Send a Number (1-5):**
```
✅ Bot processes choice
✅ Responds with specific menu
✅ Guides user through process
✅ Creates ticket or provides info
✅ Sends confirmation
```

### **When You Type "MENU":**
```
✅ Resets conversation
✅ Shows main menu again
✅ Ready for new choice
```

---

## 📞 **Support Contact for Testing**

Your configured numbers:
- **Support Email**: Check `SUPPORT_EMAIL` in `.env`
- **Support Phone**: Check `SUPPORT_PHONE` in `.env`
- **Website**: `http://localhost:5173`

---

## 🎉 **Quick Test**

**Right now, you can:**

1. Open WhatsApp on your phone
2. Send a message to your WhatsApp Business number
3. Type: `Hello`
4. Wait for the bot's menu response
5. Type: `1` to create a ticket
6. Describe an issue
7. Get confirmation with ticket number!

**The bot is READY and WAITING for messages!** 🚀

---

**Last Updated**: 2025-11-18
**Status**: ✅ Ready for Testing
