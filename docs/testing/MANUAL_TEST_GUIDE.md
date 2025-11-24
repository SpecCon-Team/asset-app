# Manual Testing Guide - Theme System

## 🎯 Purpose

This guide will help you test the theme system step by step and identify exactly what's not working.

---

## Step 1: Clean Up Old Storage

**IMPORTANT:** Do this first!

1. Open http://localhost:5174/
2. Press `F12` to open browser console
3. Copy and paste the entire content of `CLEANUP_THEME.js` into console
4. Press Enter
5. Wait for page to reload

---

## Step 2: Verify User Role

1. Make sure you're logged in
2. Open browser console (F12)
3. Copy and paste the entire content of `TEST_USER_ROLE.js` into console
4. Press Enter
5. Check the output:
   - Should show your current role (ADMIN, USER, or TECHNICIAN)
   - Should show theme storage keys for your role
   - Should show if dark class is applied

**Take a screenshot of the console output and share it if there's an issue**

---

## Step 3: Test Theme Color for Each Role

### Test ADMIN Role:

1. **Login as ADMIN**
2. **Open console and run:**
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('Current Role:', user.role);
   console.log('Should be: ADMIN');
   ```
3. **Set theme color:**
   - Click the palette icon (🎨) in top navigation
   - Select **PURPLE**
   - Check if interface turns purple immediately
4. **Verify storage:**
   ```javascript
   console.log('Color:', localStorage.getItem('themeColor_ADMIN'));
   // Should show: purple
   ```
5. **Refresh page** - Should still be purple ✅

### Test USER Role:

1. **Logout**
2. **Login as USER** (different account)
3. **Open console and run:**
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('Current Role:', user.role);
   console.log('Should be: USER');
   ```
4. **Set theme color:**
   - Click palette icon (🎨)
   - Select **BLUE**
   - Check if interface turns blue
5. **Verify storage:**
   ```javascript
   console.log('Color:', localStorage.getItem('themeColor_USER'));
   // Should show: blue
   ```
6. **Refresh page** - Should still be blue ✅

### Test TECHNICIAN Role:

1. **Logout**
2. **Login as TECHNICIAN**
3. **Open console and run:**
   ```javascript
   const user = JSON.parse(localStorage.getItem('user'));
   console.log('Current Role:', user.role);
   console.log('Should be: TECHNICIAN');
   ```
4. **Set theme color:**
   - Click palette icon (🎨)
   - Select **GREEN**
   - Check if interface turns green
5. **Verify storage:**
   ```javascript
   console.log('Color:', localStorage.getItem('themeColor_TECHNICIAN'));
   // Should show: green
   ```
6. **Refresh page** - Should still be green ✅

---

## Step 4: Test Dark/Light Mode for Each Role

### Test ADMIN - Dark Mode:

1. **Login as ADMIN**
2. **Go to Settings** (click profile → General settings)
3. **Find "Theme" dropdown**
4. **Select "Dark"**
5. **Click "Save Settings" button**
6. **Check if page turns dark immediately**
7. **Verify in console:**
   ```javascript
   console.log('Mode:', localStorage.getItem('themeMode_ADMIN'));
   // Should show: dark
   console.log('Dark class:', document.documentElement.classList.contains('dark'));
   // Should show: true
   ```
8. **Refresh page** - Should still be dark ✅

### Test USER - Light Mode:

1. **Logout**
2. **Login as USER**
3. **Go to Settings**
4. **Select "Light" theme**
5. **Click "Save Settings"**
6. **Check if page is light mode**
7. **Verify in console:**
   ```javascript
   console.log('Mode:', localStorage.getItem('themeMode_USER'));
   // Should show: light
   console.log('Dark class:', document.documentElement.classList.contains('dark'));
   // Should show: false
   ```
8. **Refresh page** - Should still be light ✅

### Test TECHNICIAN - Dark Mode:

1. **Logout**
2. **Login as TECHNICIAN**
3. **Go to Settings**
4. **Select "Dark" theme**
5. **Click "Save Settings"**
6. **Verify in console:**
   ```javascript
   console.log('Mode:', localStorage.getItem('themeMode_TECHNICIAN'));
   // Should show: dark
   ```
7. **Refresh page** - Should still be dark ✅

---

## Step 5: Test Role Switching

This tests if the theme changes when you switch between roles.

1. **Login as ADMIN** → Should see PURPLE + DARK (if you set it earlier)
2. **Logout**
3. **Login as USER** → Should **immediately** change to BLUE + LIGHT
4. **Logout**
5. **Login as TECHNICIAN** → Should **immediately** change to GREEN + DARK
6. **Logout**
7. **Login as ADMIN** → Should **immediately** change back to PURPLE + DARK

### If Theme Doesn't Switch:

**Run this in console to debug:**

```javascript
// Check polling interval
console.log('ThemeContext should be checking role every 500ms');

// Manually check current role
const user = JSON.parse(localStorage.getItem('user'));
console.log('Current user:', user);
console.log('Current role:', user.role);

// Check theme for current role
console.log('Color for role:', localStorage.getItem(`themeColor_${user.role}`));
console.log('Mode for role:', localStorage.getItem(`themeMode_${user.role}`));

// Check what's applied
console.log('Dark class:', document.documentElement.classList.contains('dark'));
console.log('Primary color:', getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
```

---

## Step 6: Report Results

For each step above, note:

1. ✅ **PASS** - Works as expected
2. ❌ **FAIL** - Doesn't work

### Example Report:

```
Step 3 - Theme Color:
- ADMIN purple: ✅ PASS
- USER blue: ❌ FAIL (doesn't change to blue)
- TECHNICIAN green: ✅ PASS

Step 4 - Dark/Light Mode:
- ADMIN dark: ✅ PASS
- USER light: ❌ FAIL (stays dark)
- TECHNICIAN dark: ✅ PASS

Step 5 - Role Switching:
- ADMIN → USER: ❌ FAIL (theme doesn't switch)
- USER → TECHNICIAN: ✅ PASS
- TECHNICIAN → ADMIN: ✅ PASS
```

---

## Common Issues and Solutions

### Issue 1: Theme Color Not Changing

**Symptoms:** Click palette icon, select color, nothing happens

**Debug:**
```javascript
// Check if ThemeContext is loaded
console.log('Check React DevTools for ThemeContext');

// Check if setThemeColor is being called
localStorage.setItem('themeColor_ADMIN', 'purple');
window.location.reload();
```

**Solution:** Check browser console for errors

---

### Issue 2: Dark Mode Not Applying

**Symptoms:** Select dark theme, page stays light

**Debug:**
```javascript
// Manually add dark class
document.documentElement.classList.add('dark');

// Check if it works
console.log('Dark class added, does page look dark now?');

// If yes, ThemeContext is not applying it correctly
```

**Solution:** Check if `applyTheme()` function is being called

---

### Issue 3: Theme Not Switching Between Roles

**Symptoms:** Logout and login as different role, theme doesn't change

**Debug:**
```javascript
// Check if role is actually changing
let lastRole = null;
setInterval(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  const currentRole = user?.role;
  if (currentRole !== lastRole) {
    console.log('ROLE CHANGED:', lastRole, '→', currentRole);
    lastRole = currentRole;
  }
}, 500);

// Now logout and login as different role
// Should see "ROLE CHANGED: ADMIN → USER" in console
```

**Solution:** If you don't see role change detection, the polling might not be working

---

### Issue 4: Theme Persists After Refresh But Not After Logout/Login

**Symptoms:** Theme saves when you refresh, but resets when you logout and login

**Debug:**
```javascript
// Check if theme is being loaded on mount
const user = JSON.parse(localStorage.getItem('user'));
console.log('User role:', user.role);
console.log('Saved color:', localStorage.getItem(`themeColor_${user.role}`));
console.log('Saved mode:', localStorage.getItem(`themeMode_${user.role}`));

// Check if these are being applied
console.log('Applied color:', getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
console.log('Applied dark:', document.documentElement.classList.contains('dark'));
```

---

## Need Help?

If you're still having issues:

1. Run `TEST_USER_ROLE.js` in console
2. Take a screenshot of the output
3. Share the screenshot with the exact steps that failed
4. Include any error messages from the console

---

## Expected Final State

After completing all tests, you should have:

```
localStorage['themeColor_ADMIN'] = 'purple'
localStorage['themeMode_ADMIN'] = 'dark'

localStorage['themeColor_USER'] = 'blue'
localStorage['themeMode_USER'] = 'light'

localStorage['themeColor_TECHNICIAN'] = 'green'
localStorage['themeMode_TECHNICIAN'] = 'dark'
```

And switching between these roles should **immediately** change the theme within 500ms.
