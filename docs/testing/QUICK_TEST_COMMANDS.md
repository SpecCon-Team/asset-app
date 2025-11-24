# Quick Test Commands

## Helper Scripts Created

### 1. List All Accounts
```bash
cd server
node listAccounts.mjs
```
Shows all user accounts with their roles and login status.

### 2. Check Ticket Assignments
```bash
cd server
node checkTicketAssignments.mjs
```
Shows:
- Total tickets count
- Status breakdown (open/in_progress/closed)
- Assignment breakdown (assigned/unassigned)
- Tickets grouped by technician
- List of unassigned tickets
- List of assigned tickets

### 3. Auto-Assign Tickets for Testing
```bash
cd server
node assignTicketsForTesting.mjs
```
Automatically assigns all unassigned tickets to technicians in round-robin fashion.
Great for quickly setting up test data!

---

## Test Accounts (Quick Reference)

| Role | Email | Password | Name |
|------|-------|----------|------|
| ADMIN | admin@example.com | password123456 | Kagiso |
| TECHNICIAN | Seah@gmail.com | password123456 | Seaparo |
| TECHNICIAN | tech@example.com | password123456 | Technician User |
| USER | test@example.com | password123456 | Test User |
| USER | jojoopiwe@gmail.com | password123456 | Jojo |

---

## Quick Test Workflow

### Option 1: Manual Testing (Recommended)
Follow the comprehensive guide: **ADMIN_TECHNICIAN_TEST_GUIDE.md**

### Option 2: Quick Auto-Test Setup
1. **Assign tickets automatically:**
   ```bash
   cd server
   node assignTicketsForTesting.mjs
   ```

2. **Login as Technician** (Seah@gmail.com)
   - Check dashboard - should show assigned tickets counts
   - Go to "My Tasks" - should see your assigned tickets
   - Try updating a ticket status
   - Try adding a comment

3. **Login as Admin** (admin@example.com)
   - Check dashboard - should show all tickets overview
   - Go to Tickets page - should see all tickets
   - Try reassigning a ticket
   - Try deleting a ticket

4. **Verify Results:**
   ```bash
   cd server
   node checkTicketAssignments.mjs
   ```

---

## Current Status (Before Testing)

**From last check:**
- Total Tickets: 11
- Unassigned: 10
- Assigned: 1 (to Test User, not a technician)
- Status: 2 open, 6 in progress, 3 closed

**What this means:**
- Seaparo (technician) currently has 0 tickets assigned → Dashboard shows 0s
- You need to either:
  - Run `assignTicketsForTesting.mjs` to auto-assign
  - OR manually assign via UI as admin
  - OR self-assign as technician

---

## Testing Checklist

### ✅ Phase 1: Setup
- [ ] Run server: `cd server && npm run dev`
- [ ] Run client: `cd client && npm run dev`
- [ ] Run auto-assign script (optional): `node assignTicketsForTesting.mjs`

### ✅ Phase 2: Technician Testing
- [ ] Login as Seaparo (Seah@gmail.com)
- [ ] Verify dashboard shows correct counts
- [ ] View "My Tasks" page
- [ ] Update a ticket status
- [ ] Update a ticket priority
- [ ] Assign a ticket to yourself
- [ ] Add a comment to a ticket
- [ ] Check notifications

### ✅ Phase 3: Admin Testing
- [ ] Login as Admin (admin@example.com)
- [ ] View all tickets
- [ ] Assign a ticket to technician
- [ ] Reassign a ticket
- [ ] Delete a ticket
- [ ] Check notifications
- [ ] Verify dashboard shows correct totals

### ✅ Phase 4: User Testing
- [ ] Login as Test User (test@example.com)
- [ ] Create a new ticket
- [ ] View your tickets
- [ ] Try to update status (should fail/be read-only)
- [ ] Add a comment
- [ ] Check notifications

### ✅ Phase 5: Verification
- [ ] Run: `node checkTicketAssignments.mjs`
- [ ] Verify counts match dashboard
- [ ] Check console logs for errors
- [ ] Test notifications across all roles

---

## Common Issues & Solutions

### Dashboard shows 0 counts for technician
**Solution:** Assign tickets to that technician
```bash
cd server
node assignTicketsForTesting.mjs
# OR login as admin and manually assign
```

### "Failed to update ticket" error
**Solution:** Already fixed! Permission for `assignedToId` changed from 'read' to 'write'
- Just refresh your browser
- If still failing, check server logs

### Notifications not showing
**Solution:**
- Check browser console for errors
- Verify server is running
- Try logging out and back in
- Check notification polling interval

### Can't delete tickets as technician
**Expected Behavior:** Only admins can delete tickets
- This is by design for data safety

---

## Pro Tips

1. **Use Browser DevTools:**
   - F12 → Console: See error messages
   - F12 → Network: Check API calls
   - F12 → Application → Local Storage: See stored user data

2. **Test in Incognito:**
   - Opens fresh session
   - No cached data
   - Good for testing different users simultaneously

3. **Multiple Browser Windows:**
   - Window 1: Admin
   - Window 2: Technician
   - Window 3: Regular User
   - Test workflows across roles in real-time

4. **Check Server Logs:**
   - Terminal running `npm run dev` shows request logs
   - Look for 403/401 errors (permission issues)
   - Look for 500 errors (server issues)

---

## Need Help?

1. **Check the comprehensive guide:** ADMIN_TECHNICIAN_TEST_GUIDE.md
2. **Run diagnostic scripts:**
   - `node listAccounts.mjs` - Check users
   - `node checkTicketAssignments.mjs` - Check tickets
3. **Check server logs** in the terminal
4. **Check browser console** (F12) for frontend errors
