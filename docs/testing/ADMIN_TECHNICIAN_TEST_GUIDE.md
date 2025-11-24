# Admin & Technician Workflow Testing Guide

## Test Accounts Available

### Admin Account
- **Email:** admin@example.com
- **Name:** Kagiso
- **Role:** ADMIN
- **Password:** password123456

### Technician Accounts
1. **Seaparo (Current logged in)**
   - **Email:** Seah@gmail.com
   - **Name:** Seaparo
   - **Role:** TECHNICIAN
   - **Password:** password123456

2. **Technician User**
   - **Email:** tech@example.com
   - **Name:** Technician User
   - **Role:** TECHNICIAN
   - **Password:** password123456

### Regular User Account
- **Email:** test@example.com
- **Name:** Test User
- **Role:** USER
- **Password:** password123456

---

## Test Scenario 1: Admin Assigns Ticket to Technician

### Step 1: Login as Admin
1. Logout current user (Seaparo)
2. Login with: `admin@example.com` / `password123456`
3. You should see the Admin Dashboard

### Step 2: View All Tickets
1. Navigate to **Tickets** page (or "All Tickets" from dashboard)
2. You should see all 11 tickets
3. Look for unassigned tickets (most should be unassigned)

### Step 3: Assign a Ticket to Technician
1. Click on any unassigned ticket (e.g., TKT-1763294830)
2. In the ticket details page, look for the "Assign To" field
3. Select **Seaparo** (Seah@gmail.com) from the dropdown
4. Click **Update Ticket** or **Save**
5. ✅ **Expected Result:** Success message, ticket assigned to Seaparo

### Step 4: Assign Multiple Tickets
1. Go back to Tickets list
2. Assign 2-3 more tickets to Seaparo
3. Assign 1-2 tickets to "Technician User" (tech@example.com)

### Step 5: Check Admin Dashboard
1. Go back to Dashboard
2. ✅ **Expected Result:** Dashboard should show:
   - Total tickets count
   - Assigned/unassigned breakdown
   - Recent activity

---

## Test Scenario 2: Technician Views Assigned Tickets

### Step 1: Login as Technician
1. Logout admin
2. Login with: `Seah@gmail.com` / `password123456`

### Step 2: Check Dashboard
1. You should see the Technician Dashboard
2. ✅ **Expected Result:** Dashboard should show:
   - **Unassigned Tickets:** ~7-8 (reduced from 10)
   - **My Open Tickets:** 3-4 (tickets assigned to you)
   - **In Progress:** 0
   - **Completed Today:** 0
   - **High Priority:** (count of high priority tickets assigned to you)

### Step 3: View My Tasks
1. Click on "My Open Tickets" card OR navigate to "My Tasks"
2. ✅ **Expected Result:** Should only see tickets assigned to Seaparo

---

## Test Scenario 3: Technician Updates Ticket

### Step 1: Open a Ticket
1. From "My Tasks" or Dashboard, click on one of your assigned tickets

### Step 2: Change Status to "In Progress"
1. Find the Status dropdown
2. Change from "Open" to "In Progress"
3. Add a comment: "Working on this issue now"
4. Click **Update** or **Save**
5. ✅ **Expected Result:**
   - Ticket status updated successfully
   - Comment added
   - Notification sent to ticket creator

### Step 3: Check Dashboard Update
1. Go back to Dashboard
2. ✅ **Expected Result:**
   - **My Open Tickets:** Reduced by 1
   - **In Progress:** Increased to 1

### Step 4: Complete a Ticket
1. Open the ticket you just set to "In Progress"
2. Change status to "Closed"
3. Add resolution: "Issue resolved by restarting the service"
4. Click **Update**
5. ✅ **Expected Result:**
   - Ticket closed successfully
   - Dashboard shows 1 completed ticket

---

## Test Scenario 4: Technician Self-Assigns Ticket

### Step 1: View All Tickets
1. Navigate to **Tickets** page
2. You should see all tickets (both assigned and unassigned)

### Step 2: Self-Assign an Unassigned Ticket
1. Click on an unassigned ticket
2. In the "Assign To" dropdown, select **yourself (Seaparo)**
3. Click **Update**
4. ✅ **Expected Result:** Ticket assigned to you

### Step 3: Verify Dashboard
1. Go back to Dashboard
2. ✅ **Expected Result:**
   - **Unassigned Tickets:** Reduced by 1
   - **My Open Tickets:** Increased by 1

---

## Test Scenario 5: Notifications System

### Step 1: Check Notifications as Technician
1. Look at the notification bell icon (top right)
2. ✅ **Expected Result:** Should see notification(s) from when admin assigned tickets to you

### Step 2: Login as Regular User
1. Logout technician
2. Login with: `test@example.com` / `password123456`

### Step 3: Create a New Ticket
1. Navigate to "New Ticket" or "Create Ticket"
2. Fill in:
   - Title: "Laptop keyboard not working"
   - Description: "Keys F, J, and K are not responding"
   - Priority: High
3. Submit the ticket
4. ✅ **Expected Result:** Ticket created successfully

### Step 4: Check Admin Notifications
1. Logout and login as admin (`admin@example.com`)
2. Check notification bell
3. ✅ **Expected Result:** Should see notification about new ticket

### Step 5: Admin Assigns to Technician
1. Admin assigns the new ticket to Seaparo
2. ✅ **Expected Result:**
   - Ticket assigned
   - Notification sent to Seaparo
   - Notification sent to ticket creator (Test User)

### Step 6: Check Technician Notifications
1. Logout and login as Seaparo (`Seah@gmail.com`)
2. Check notification bell
3. ✅ **Expected Result:** Should see notification about ticket assignment

### Step 7: Technician Updates Ticket
1. Update ticket status to "In Progress"
2. ✅ **Expected Result:** Notification sent to Test User (ticket creator)

### Step 8: Check User Notifications
1. Logout and login as Test User (`test@example.com`)
2. Check notification bell
3. ✅ **Expected Result:** Should see notifications:
   - Ticket assigned to Seaparo
   - Ticket status changed to "In Progress"

---

## Test Scenario 6: Permission Testing

### Test 1: Technician Cannot Delete Tickets
1. Login as Technician (Seah@gmail.com)
2. Go to any ticket
3. ✅ **Expected Result:** No "Delete" button visible (only Admins can delete)

### Test 2: Technician Can Update Status/Priority/Assignment
1. Open any ticket assigned to you
2. Try changing:
   - ✅ Status: Should work
   - ✅ Priority: Should work
   - ✅ Assigned To: Should work (now fixed!)
   - ✅ Resolution: Should work
   - ✅ Title/Description: Should work

### Test 3: Regular User Has Limited Permissions
1. Login as Test User (test@example.com)
2. Open a ticket you created
3. ✅ **Expected Result:**
   - ❌ Cannot change Status (read-only)
   - ❌ Cannot change Priority (read-only)
   - ❌ Cannot change Assignment (not visible)
   - ✅ Can edit Title/Description
   - ✅ Can add comments

---

## Test Scenario 7: Dashboard Accuracy

### For Technician Dashboard:
1. Login as Seaparo
2. Count manually:
   - Tickets with `assignedToId = null` → Unassigned count
   - Tickets assigned to you with `status = 'open'` → My Open Tickets
   - Tickets assigned to you with `status = 'in_progress'` → In Progress
   - Tickets assigned to you with `status = 'closed'` and updated today → Completed Today
3. ✅ **Expected Result:** Dashboard numbers match your manual count

### For Admin Dashboard:
1. Login as Admin
2. ✅ **Expected Result:** Dashboard shows:
   - Total tickets
   - Open/In Progress/Closed breakdown
   - High priority tickets
   - Recent activity

---

## Known Issues to Test

### ✅ FIXED: Technician Cannot Update Tickets
- **Issue:** Technician was getting "Failed to update ticket" error
- **Fix Applied:** Changed `assignedToId` permission from 'read' to 'write' for technicians
- **Test:** Try updating any ticket field as technician → Should work now

### ✅ FIXED: Dashboard Showing 0 Counts
- **Issue:** Dashboard showed 0 for all counts even with tickets
- **Root Cause:** No tickets were assigned to the technician
- **Fix Applied:** Added "Unassigned Tickets" card and improved empty state
- **Test:** Dashboard should show accurate counts now

---

## Quick Test Checklist

- [ ] Admin can view all tickets
- [ ] Admin can assign tickets to technicians
- [ ] Admin can delete tickets
- [ ] Technician can view all tickets
- [ ] Technician can view only their assigned tickets in "My Tasks"
- [ ] Technician can update ticket status
- [ ] Technician can update ticket priority
- [ ] Technician can assign/reassign tickets (including self-assign)
- [ ] Technician can add comments
- [ ] Technician cannot delete tickets
- [ ] Regular user can create tickets
- [ ] Regular user can only view their own tickets
- [ ] Regular user cannot change status/priority
- [ ] Notifications are sent when:
  - [ ] New ticket is created (to admins/techs)
  - [ ] Ticket is assigned (to assignee and creator)
  - [ ] Ticket status changes (to creator)
  - [ ] Comments are added (to relevant users)
- [ ] Dashboard counts are accurate for:
  - [ ] Admin dashboard
  - [ ] Technician dashboard
  - [ ] User dashboard

---

## Troubleshooting

### If dashboard counts are still 0:
1. Make sure you're logged in as the correct user
2. Check browser console for errors (F12)
3. Verify tickets are actually assigned to your user ID
4. Try refreshing the page

### If ticket updates fail:
1. Check browser console for error messages
2. Verify server is running (`npm run dev` in server folder)
3. Check server logs for permission errors
4. Verify JWT token is valid (try logging out and back in)

### If notifications don't appear:
1. Check if notifications are being created in database
2. Verify notification polling is working
3. Check browser console for WebSocket/polling errors
4. Try refreshing the page

---

## Next Steps After Testing

1. **Report any bugs found** with:
   - User role involved
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console errors (if any)

2. **Suggest improvements** such as:
   - Better UI/UX for ticket assignment
   - Bulk operations
   - Filtering/sorting options
   - Additional notification types

3. **Performance testing** with:
   - Many tickets (100+)
   - Multiple technicians
   - Concurrent updates
