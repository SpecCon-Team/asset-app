# 🧪 Test WhatsApp User Separation & Notifications

## Quick Test Guide

### ✅ What's Been Implemented:

1. **WhatsApp users are now marked** with `isWhatsAppUser = true`
2. **Separate filtering** - Get WhatsApp users vs regular users
3. **Automatic notifications** - When ticket status changes to resolved/closed
4. **3 existing WhatsApp users** have been updated

---

## 🧪 Test 1: View WhatsApp Users

### Using API:

```bash
# Get all WhatsApp users
curl http://localhost:4000/api/users?type=whatsapp \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get regular users only
curl http://localhost:4000/api/users?type=regular \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Result:
- WhatsApp users: 3 users (Kagiso~, Test User, WhatsApp User 4733)
- Regular users: 4 users (Seaparo, Technician User, Test User, Jojo, Kagiso)

---

## 🧪 Test 2: Create Ticket via WhatsApp

### Steps:

1. **Send message to bot:**
   ```
   Send: "Hi" to +27639477702
   ```

2. **Select create ticket:**
   ```
   Send: "1"
   ```

3. **Describe issue:**
   ```
   Send: "My keyboard is not working"
   ```

4. **Verify:**
   - ✅ Ticket created successfully
   - ✅ You receive confirmation with ticket number
   - ✅ Check dashboard - ticket appears

---

## 🧪 Test 3: Test Notification System

### Steps:

1. **Login to dashboard as Admin:**
   - Email: admin@example.com
   - Password: (your admin password)

2. **Find the ticket created in Test 2**

3. **Update ticket status:**
   - Click on the ticket
   - Change status to **"Resolved"**
   - Add resolution: "Replaced keyboard and tested"
   - Click Save/Update

4. **Check WhatsApp:**
   - Within 1-2 seconds, you should receive:
   ```
   ✅ *Ticket RESOLVED*

   📋 Ticket #TKT-XXXXX
   📌 Title: My keyboard is not working
   📊 Status: RESOLVED

   📝 Resolution: Replaced keyboard and tested

   Your issue has been resolved! If you have any concerns, you can reopen this ticket.

   🔗 View details: http://localhost:5173/tickets

   Type *MENU* for more options.
   ```

5. **Check server logs:**
   ```
   📱 Sending WhatsApp notification for ticket TKT-XXXXX to 27606344230
   ✅ WhatsApp notification sent for ticket TKT-XXXXX
   ```

---

## 🧪 Test 4: Test Closed Status

### Steps:

1. **Change ticket status to "Closed"** (instead of Resolved)

2. **Check WhatsApp notification:**
   ```
   🔒 *Ticket CLOSED*

   📋 Ticket #TKT-XXXXX
   📌 Title: My keyboard is not working
   📊 Status: CLOSED

   Your ticket has been closed. Thank you for using our support service!

   🔗 View details: http://localhost:5173/tickets

   Type *MENU* for more options.
   ```

---

## 🧪 Test 5: No Notification for Other Status

### Steps:

1. **Change ticket status to "In Progress"**
2. **Check WhatsApp** - NO notification should be sent
3. **Change status to "Open"**
4. **Check WhatsApp** - NO notification should be sent

**Expected:** Notifications only sent for "resolved" and "closed" statuses

---

## 🧪 Test 6: Regular User (No Notification)

### Steps:

1. **Create a ticket via dashboard** (not WhatsApp):
   - Login as regular user (Jojo or Kagiso)
   - Create new ticket manually

2. **Close the ticket as admin**

3. **Check WhatsApp** - NO notification sent (user is not WhatsApp user)

4. **Verify in logs:** Should NOT see "📱 Sending WhatsApp notification..."

---

## 📊 Verification Checklist

After all tests, verify:

- [ ] WhatsApp users show `isWhatsAppUser: true` in database
- [ ] API endpoint `/api/users?type=whatsapp` returns only WhatsApp users
- [ ] API endpoint `/api/users?type=regular` returns only regular users
- [ ] Tickets created via WhatsApp work correctly
- [ ] Notifications sent when status = "resolved"
- [ ] Notifications sent when status = "closed"
- [ ] NO notifications for other statuses
- [ ] NO notifications for regular users
- [ ] Server logs show notification activity
- [ ] WhatsApp messages received instantly (1-2 seconds)

---

## 🔍 Troubleshooting

### No notification received?

**Check 1: User is marked as WhatsApp user**
```bash
node checkUsers.mjs
# Look for isWhatsAppUser: true
```

**Check 2: Notifications enabled**
```bash
# Check user.whatsAppNotifications = true
```

**Check 3: Phone number exists**
```bash
# User must have valid phone number
```

**Check 4: Server logs**
```bash
# Look for:
# ❌ Any errors about WhatsApp sending
# ✅ "📱 Sending WhatsApp notification..."
# ✅ "✅ WhatsApp notification sent..."
```

**Check 5: Access token valid**
```bash
# If token expired, notifications will fail
# Check server logs for "Session has expired" errors
```

---

## 💡 Quick Fixes

### Update existing users:
```bash
node markWhatsAppUsers.mjs
```

### Manually enable notifications for a user:
```sql
UPDATE "User"
SET "whatsAppNotifications" = true
WHERE "phone" = '27606344230';
```

### Check notification settings:
```bash
node -e "
import('./src/lib/prisma.js').then(async ({ prisma }) => {
  const user = await prisma.user.findFirst({
    where: { phone: { contains: '606344230' } },
    select: { name: true, isWhatsAppUser: true, whatsAppNotifications: true }
  });
  console.log(user);
  process.exit(0);
});
"
```

---

## 🎯 Success Criteria

✅ **All features working when:**
1. WhatsApp users are identified correctly
2. Users can be filtered by type
3. Notifications sent automatically on ticket close/resolve
4. Notifications NOT sent for other statuses
5. Regular users don't receive WhatsApp notifications
6. Server logs show proper activity
7. Messages arrive within 1-2 seconds

---

## 📝 Test Results Template

```
Test Date: ___________
Tested By: ___________

Test 1 - View WhatsApp Users:        [ ] PASS  [ ] FAIL
Test 2 - Create Ticket via WhatsApp: [ ] PASS  [ ] FAIL
Test 3 - Resolved Notification:      [ ] PASS  [ ] FAIL
Test 4 - Closed Notification:        [ ] PASS  [ ] FAIL
Test 5 - No Notification (other):    [ ] PASS  [ ] FAIL
Test 6 - Regular User (no notif):    [ ] PASS  [ ] FAIL

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## 🚀 Ready to Test!

Run through all tests and verify everything works as expected!

**Start with Test 1 and work your way through to Test 6.**

Good luck! 🎉
