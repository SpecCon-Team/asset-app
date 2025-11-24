# Test Theme System - Quick Guide

## Before Testing: Clean Up Old Storage

**IMPORTANT:** Run this cleanup script first to remove old conflicting theme data:

1. Open your browser console (Press `F12` or `Ctrl+Shift+J`)
2. Open the file `CLEANUP_THEME.js` in this folder
3. Copy ALL the content
4. Paste it into the browser console
5. Press Enter
6. Wait for page to reload automatically

## Test Scenario

### Setup: Login as Different Roles

You need access to at least 2 different user accounts with different roles (e.g., ADMIN and USER).

---

## Test 1: Admin Theme

1. **Login as ADMIN**
2. **Change theme color:**
   - Click the palette icon (🎨) in the top navigation bar
   - Select **PURPLE** color
   - The interface should immediately turn purple
3. **Change theme mode:**
   - Click on your profile dropdown → "General settings"
   - Find "Theme" dropdown
   - Select **Dark**
   - Click **Save Settings**
   - The page should turn dark immediately
4. **Verify persistence:**
   - Refresh the page (`F5`)
   - Should still be **PURPLE + DARK** ✅
5. **Logout**

---

## Test 2: User Theme

1. **Login as USER** (different account)
2. **Change theme color:**
   - Click the palette icon (🎨)
   - Select **BLUE** color
   - Interface should turn blue
3. **Change theme mode:**
   - Go to Settings
   - Select **Light** theme
   - Click **Save Settings**
   - Page should be light mode
4. **Verify persistence:**
   - Refresh the page
   - Should still be **BLUE + LIGHT** ✅
5. **Logout**

---

## Test 3: Verify Separation Between Roles

1. **Login as ADMIN** again
   - Should see **PURPLE + DARK** ✅ (NOT blue/light from user)
2. **Logout**
3. **Login as USER** again
   - Should see **BLUE + LIGHT** ✅ (NOT purple/dark from admin)
4. **Switch back to ADMIN**
   - Should STILL see **PURPLE + DARK** ✅

---

## Test 4: Multiple Browser Tabs

1. **Login as ADMIN in Tab 1**
   - Set to PURPLE + DARK
2. **Open Tab 2**
   - Navigate to your app
   - Should be PURPLE + DARK (same as Tab 1) ✅
3. **In Tab 1, change to GREEN + LIGHT**
4. **Refresh Tab 2**
   - Should update to GREEN + LIGHT ✅

---

## Expected Results

✅ Each role (ADMIN, USER, TECHNICIAN) has its own theme preferences
✅ Changing one role's theme does NOT affect other roles
✅ Theme persists after page refresh
✅ Theme persists after logout and login
✅ Theme syncs across multiple tabs for same role

---

## If Something is Wrong

### Problem: Theme not changing when you select color/mode

**Solution:**
1. Check browser console (F12) for errors
2. Run the cleanup script again (CLEANUP_THEME.js)
3. Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Problem: Theme changes but doesn't persist after refresh

**Solution:**
1. Check browser console (F12) and look for localStorage errors
2. Make sure you're not in private/incognito mode
3. Check if localStorage is enabled in your browser
4. Run: `localStorage.getItem('user')` in console - should show your user data

### Problem: Admin and User see the same theme

**Solution:**
1. Run the cleanup script (CLEANUP_THEME.js)
2. Open console and run:
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('Role:', user.role);
   console.log('Theme Color:', localStorage.getItem(`themeColor_${user.role}`));
   console.log('Theme Mode:', localStorage.getItem(`themeMode_${user.role}`));
   ```
3. If you see "undefined" or "null", manually set it:
   ```javascript
   localStorage.setItem('themeColor_ADMIN', 'purple');
   localStorage.setItem('themeMode_ADMIN', 'dark');
   localStorage.setItem('themeColor_USER', 'blue');
   localStorage.setItem('themeMode_USER', 'light');
   window.location.reload();
   ```

### Problem: Dark mode not applying

**Solution:**
1. Check if dark class is on root element:
   ```javascript
   console.log('Has dark class:', document.documentElement.classList.contains('dark'));
   ```
2. If false when it should be true, run:
   ```javascript
   document.documentElement.classList.add('dark');
   ```
3. If this fixes it temporarily, run the cleanup script

---

## Debug Helper

Run this in console to see current theme state:

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('=== CURRENT THEME STATE ===');
console.log('User:', user.email);
console.log('Role:', user.role);
console.log('Theme Color:', localStorage.getItem(`themeColor_${user.role}`));
console.log('Theme Mode:', localStorage.getItem(`themeMode_${user.role}`));
console.log('Dark class applied:', document.documentElement.classList.contains('dark'));
console.log('Primary color:', getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
```

---

## All Tests Passed?

If all tests pass:
1. ✅ Your theme system is working correctly!
2. ✅ Each role has independent theme preferences
3. ✅ Theme persists and syncs properly
4. 🎉 You're done!

If tests failed, check the troubleshooting section above or see `DEBUG_THEME.md` for more detailed debugging steps.
