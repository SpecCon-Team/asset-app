# 📱 Manual WhatsApp Bot Test Instructions

## 🎯 Goal
Test the complete WhatsApp flow with notifications working.

---

## ⚡ Quick Steps

### Step 1: Restart Your Server
In the terminal where `npm run dev` is running:

1. **Press `Ctrl+C`** (stops the server)
2. **Wait 2 seconds**
3. **Type: `npm run dev`** (starts server with new code)
4. **Wait for**: `✅ Database connected successfully`

---

### Step 2: Send WhatsApp Message
From your phone, send a WhatsApp message:

**📱 FROM (your phone):**
- **+27 71 291 9486** (Kagiso's phone)
- OR **+27 60 634 4230** (Jojo's phone)

**📱 TO (business number):**
- **+27 63 947 7702** (AssetPro)

**💬 MESSAGE:**
```
Printer not working
```

---

### Step 3: Watch Server Terminal
You should see these logs appear:

```
📩 Received webhook: {...}
✅ Webhook object validated
📦 Processing 1 entries...
📱 Message from: 27712919486, type: text
Message content: "Printer not working"
✅ Found user: Kagiso~
✅ Created ticket: TKT-00028
✅ Created 3 notifications for admins/technicians  ← IMPORTANT!
WhatsApp message sent successfully: {...}
✅ Confirmation sent to 27712919486
✅ Webhook processing complete
```

**Key line to look for:**
```
✅ Created 3 notifications for admins/technicians
```

If you see this, notifications are working! ✅

---

### Step 4: Check Admin Dashboard

1. Open browser: http://localhost:5173
2. **Login as admin:**
   - Email: `admin@example.com`
   - Password: `Admin123!`

3. **Click the bell icon 🔔** (top right)
4. You should see:
   ```
   🔔 New ticket TKT-00028 created via WhatsApp by Kagiso~
   ```

---

### Step 5: Check WhatsApp Reply

On the phone you sent FROM (+27 71 291 9486 or +27 60 634 4230):

You should receive:
```
✅ Ticket Created Successfully!

📋 Ticket #TKT-00028
📌 Title: Printer not working
⚡ Priority: medium
📊 Status: open

We've received your request and will get back to you soon!

🔗 Track your ticket: http://localhost:5173/tickets

Thank you for contacting us! 🙏
```

---

## ✅ Success Checklist

- [ ] Server restarted successfully
- [ ] Sent WhatsApp message to +27 63 947 7702
- [ ] Server logs show "Created X notifications"
- [ ] Admin dashboard shows notification
- [ ] WhatsApp reply received on phone

---

## 🚨 Troubleshooting

### Issue: Server doesn't restart
**Fix:**
```bash
# Force kill any running servers
pkill -f "tsx watch"

# Start fresh
cd server
npm run dev
```

### Issue: No "Created notifications" in logs
**Problem:** Old code still running
**Fix:** Restart server (Step 1)

### Issue: No webhook received
**Check:**
1. Is ngrok still running? `curl http://localhost:4040/api/tunnels`
2. Is webhook URL correct in Meta Console?
3. Did you send to the correct business number?

### Issue: "No user found" error
**Problem:** Phone number not in database
**Fix:**
- Use +27 71 291 9486 or +27 60 634 4230
- Or register your phone number in the app first

### Issue: No WhatsApp reply received
**Possible reasons:**
1. Check if message was sent (look for "WhatsApp message sent successfully" in logs)
2. 24-hour window expired (user must message you first)
3. Wrong phone number
4. Access token expired (check with: `node fullDiagnostic.mjs`)

---

## 📊 What's Different Now?

**Before:**
- ✅ Ticket created
- ❌ No notifications sent
- ✅ WhatsApp reply sent

**After (with new code):**
- ✅ Ticket created
- ✅ Notifications sent to admins/technicians ← NEW!
- ✅ WhatsApp reply sent

---

## 🎯 Expected Output Comparison

### Server Logs - OLD:
```
✅ Created ticket: TKT-00026
✅ Confirmation sent to 27712919486
```

### Server Logs - NEW:
```
✅ Created ticket: TKT-00028
✅ Created 3 notifications for admins/technicians  ← THIS IS NEW!
✅ Confirmation sent to 27712919486
```

---

## 💡 Pro Tips

1. **Keep terminal visible** while sending WhatsApp message so you see logs in real-time
2. **Test with a simple message first** like "test" to verify flow works
3. **Check notification bell immediately** after sending - notifications appear instantly
4. **Don't wait too long** between sending message and checking dashboard

---

## 🔥 Quick Test Command

If you want to verify server is running the new code:

```bash
# Check if notification code exists in running file
grep -c "Create notifications for admins" src/routes/whatsapp.ts
```

Should return: `1` (meaning the code is there)

---

## 📞 Current Configuration

**ngrok URL:** `https://prouniversity-catheryn-thistly.ngrok-free.dev`
**Business Number:** +27 63 947 7702 (AssetPro)
**Webhook:** `https://prouniversity-catheryn-thistly.ngrok-free.dev/api/whatsapp/webhook`

**Test Numbers (registered in database):**
- +27 71 291 9486 (Kagiso~)
- +27 60 634 4230 (Test User/Jojo)

**Admin Login:**
- Email: admin@example.com
- Password: Admin123!

---

## ✨ You're Ready!

Everything is set up correctly. Just:
1. Restart server
2. Send WhatsApp message
3. Watch it work!

Good luck! 🚀
