# WhatsApp Bot - Interactive Menu System

## 🎯 Overview

Your WhatsApp bot now has an **interactive menu system** that allows ANY customer to:
- Create support tickets
- Check ticket status
- Make general enquiries
- Report urgent issues
- Get contact information

**No registration required!** New users are automatically created when they send their first message.

---

## 🚀 How It Works

### 1. **Automatic User Registration**
When someone sends a message to your WhatsApp Business number (+27639477702):
- If they're a new user → System automatically creates an account
- If they're existing → System recognizes them
- No manual signup needed!

### 2. **Interactive Menu Flow**

**First Message:**
When a user sends ANY message (e.g., "Hi", "Hello", "Help"), they receive:

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

### 3. **Menu Options Explained**

#### Option 1: Create a Support Ticket
- User selects "1"
- Bot asks for issue description
- User types their problem
- Ticket created with MEDIUM priority
- User receives ticket number and confirmation

#### Option 2: Check My Tickets Status
- User selects "2"
- Bot shows list of their recent tickets
- Shows status, priority, and ticket numbers
- Link to view online

#### Option 3: General Enquiry
- User selects "3"
- Bot asks for their question
- User types enquiry
- Ticket created with LOW priority
- Team will respond via ticket system

#### Option 4: Report an Issue
- User selects "4"
- Bot asks for issue details
- User describes the problem
- Ticket created with HIGH priority
- Urgent issues get faster attention

#### Option 5: Contact Support Team
- User selects "5"
- Bot provides:
  - Email address
  - Phone number
  - Website URL
  - Support hours

---

## 💬 Example Conversation

**User:** Hi

**Bot:**
```
👋 Welcome WhatsApp User 7702!

How can I help you today?

Please reply with a number:

1️⃣ Create a Support Ticket
2️⃣ Check My Tickets Status
3️⃣ General Enquiry
4️⃣ Report an Issue
5️⃣ Contact Support Team

Type the number of your choice (1-5)
```

**User:** 1

**Bot:**
```
📝 Create Support Ticket

Please describe your issue or request in detail.

You can include:
• What's the problem?
• When did it start?
• Any error messages?

Type your message below:
```

**User:** My laptop screen is flickering. Started this morning. Can't work properly.

**Bot:**
```
✅ Ticket Created Successfully!

📋 Ticket #TKT-00042
📌 Title: My laptop screen is flickering
⚡ Priority: MEDIUM
📊 Status: OPEN

We've received your request and our team will get back to you soon!

🔗 Track online: http://localhost:5173/tickets

Type MENU to return to main menu.
Thank you! 🙏
```

---

## 🔄 Conversation Management

### Resetting the Menu
Users can type these keywords anytime to restart:
- `MENU`
- `START`
- `RESTART`
- `HELP`

### Session Timeout
- Conversations expire after 30 minutes of inactivity
- Automatic cleanup prevents memory issues
- Users simply start fresh next time

---

## ✨ Key Features

### ✅ Auto User Registration
- Creates users automatically with phone number
- Format: `WhatsApp User [last 4 digits]`
- Email: `whatsapp_[timestamp]@temp.local`
- Role: USER (standard customer)

### ✅ Smart Phone Matching
Finds users by:
- Exact phone match
- Cleaned phone number (no spaces/symbols)
- Last 10 digits match

### ✅ Priority Assignment
- **General Enquiry** → LOW priority
- **Support Ticket** → MEDIUM priority
- **Report Issue** → HIGH priority

### ✅ Ticket Notifications
When tickets are created:
- All admins get notified
- All technicians get notified
- Shows who created it and ticket number

### ✅ Conversation State
- Remembers where user is in conversation
- Handles multi-step flows
- Clean error handling

---

## 🛠️ Configuration

### Environment Variables

You can customize these in your `.env` file:

```bash
# Support Contact Info (shown in option 5)
SUPPORT_EMAIL="support@yourcompany.com"
SUPPORT_PHONE="+27123456789"

# Web Portal URL
CLIENT_URL="https://yourdomain.com"
```

---

## 📊 What Admins See

When a customer creates a ticket via WhatsApp:

1. **Notification** appears in dashboard
2. **Ticket** shows up in tickets list
3. **Ticket details** include:
   - Created via WhatsApp
   - Customer's phone number
   - Full description
   - Assigned priority

Admins can:
- Assign to technicians
- Update status
- Add comments
- Close when resolved

---

## 🧪 Testing

### Test Checklist:

1. ✅ **First Message** - Send "Hi" from any number
   - Should receive welcome menu

2. ✅ **Create Ticket (Option 1)**
   - Send "1"
   - Type issue description
   - Receive ticket confirmation

3. ✅ **Check Status (Option 2)**
   - Send "2"
   - See list of tickets

4. ✅ **General Enquiry (Option 3)**
   - Send "3"
   - Type question
   - Receive confirmation

5. ✅ **Report Issue (Option 4)**
   - Send "4"
   - Type urgent issue
   - Receive high priority ticket

6. ✅ **Contact Info (Option 5)**
   - Send "5"
   - Receive support details

7. ✅ **Reset Menu**
   - Type "MENU" anytime
   - Receive menu again

---

## 🔧 Troubleshooting

### No response from bot?
1. Check ngrok is running: `~/bin/ngrok http 4000`
2. Verify webhook is configured in Meta
3. Check server logs for errors

### User not created automatically?
- Check server logs for database errors
- Verify phone number format in logs
- Check Prisma connection

### Tickets not appearing in dashboard?
- Verify user role is 'USER'
- Check ticket createdById matches user.id
- Look for database errors in logs

### Menu options not working?
- Ensure user sends just the number (1-5)
- Check conversation state in server logs
- Verify message is text type

---

## 📝 Future Enhancements

Possible additions:
- 📸 Accept images for tickets
- 🗣️ Voice message transcription
- 📍 Location sharing for on-site issues
- ⏰ Schedule callback requests
- 📊 Ticket rating/feedback
- 🔔 Status update notifications
- 💬 Direct chat with assigned technician

---

## 🎉 Summary

Your WhatsApp bot is now a **full-featured customer service assistant** that:

✅ Works with ANY phone number (no registration needed)
✅ Provides interactive menu for easy navigation
✅ Creates tickets with appropriate priority
✅ Allows customers to check their ticket status
✅ Automatically notifies your support team
✅ Handles conversations intelligently

**Just make sure ngrok is running and the webhook is configured in Meta!**

---

## 📞 Quick Start Commands

```bash
# 1. Start server (if not running)
cd server
npm run dev

# 2. Start ngrok
~/bin/ngrok http 4000

# 3. Update Meta webhook with ngrok URL
# Go to: https://developers.facebook.com/apps
# Use: https://your-ngrok-url.ngrok.io/api/whatsapp/webhook

# 4. Test it!
# Send "Hi" to +27639477702
```

🎊 **You're all set!**
