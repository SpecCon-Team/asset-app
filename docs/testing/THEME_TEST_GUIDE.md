# Theme Testing Guide - Role-Based Separation

## ✅ What's Been Fixed

1. Removed conflicting theme application in `AppLayout.tsx`
2. Theme is now **100% managed by ThemeContext** with role-based storage
3. Both color AND mode are separated by role

---

## 🧪 Step-by-Step Testing

### Test 1: Set Admin Theme

1. **Login as Admin**
2. Click the **palette icon** (🎨) in top navigation
3. Select **Purple** color
4. Click your profile → Toggle dark mode **ON**
5. **Verify**: You should see purple buttons/links in dark mode
6. **Logout**

### Test 2: Set User Theme

1. **Login as User** (different account)
2. Click the **palette icon** (🎨)
3. Select **Blue** color
4. Make sure dark mode is **OFF** (light mode)
5. **Verify**: You should see blue buttons/links in light mode
6. **Logout**

### Test 3: Verify Persistence

1. **Login as Admin** again
2. **Expected**: Should immediately show **Purple + Dark mode** ✅
3. **Logout**
4. **Login as User** again
5. **Expected**: Should immediately show **Blue + Light mode** ✅

---

## 🔍 Console Debugging

If themes aren't working, open DevTools (F12) and run these commands:

### Check Current Settings:
```javascript
// Get current user
const user = JSON.parse(localStorage.getItem('user'));
console.log('Current User:', user.email, 'Role:', user.role);

// Check role-based theme
console.log('Theme Color:', localStorage.getItem(`themeColor_${user.role}`));
console.log('Theme Mode:', localStorage.getItem(`themeMode_${user.role}`));
```

### Check All Roles:
```javascript
console.log('=== ALL ROLE THEMES ===');
['ADMIN', 'TECHNICIAN', 'USER'].forEach(role => {
  console.log(`\n${role}:`);
  console.log('  Color:', localStorage.getItem(`themeColor_${role}`) || 'not set');
  console.log('  Mode:', localStorage.getItem(`themeMode_${role}`) || 'not set');
});
```

### Clear Everything and Start Fresh:
```javascript
// Clear all old theme settings
localStorage.removeItem('themeColor');
localStorage.removeItem('themeMode');
localStorage.removeItem('themeColor_ADMIN');
localStorage.removeItem('themeColor_TECHNICIAN');
localStorage.removeItem('themeColor_USER');
localStorage.removeItem('themeMode_ADMIN');
localStorage.removeItem('themeMode_TECHNICIAN');
localStorage.removeItem('themeMode_USER');

// Clear old user-specific settings
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('themeColor_c') || key.startsWith('appSettings_')) {
    localStorage.removeItem(key);
  }
});

console.log('✅ All theme settings cleared');
console.log('🔄 Reload page to start fresh');
```

---

## 🎨 Expected Behavior

### When you change theme color:
1. Color changes immediately ✅
2. Saves to `themeColor_<ROLE>` ✅
3. Persists after logout/login ✅
4. Only affects your role, not other roles ✅

### When you toggle dark mode:
1. Mode changes immediately ✅
2. Saves to `themeMode_<ROLE>` ✅
3. Persists after logout/login ✅
4. Only affects your role, not other roles ✅

---

## 🚨 Troubleshooting

### Issue: Theme changes but doesn't save

**Check:**
```javascript
const user = localStorage.getItem('user');
if (!user) {
  console.error('❌ No user logged in');
} else {
  const parsed = JSON.parse(user);
  console.log('✅ Logged in as:', parsed.email, 'Role:', parsed.role);
}
```

### Issue: Theme reverts after refresh

**Solution:** Clear browser cache or use the "Clear Everything" script above.

### Issue: All roles still share theme

**Check if AppLayout is interfering:**
```javascript
// Look for this in console
console.log('AppLayout applying theme?');
// If you see this, the old code is still running
```

**Solution:** Make sure `AppLayout.tsx` is updated (line 70 should be empty function).

### Issue: Old theme values still appearing

**Clear old storage keys:**
```javascript
// Remove old individual user keys
Object.keys(localStorage).forEach(key => {
  // Old pattern: themeColor_clxyz123 (user ID)
  if (key.startsWith('themeColor_c')) {
    console.log('Removing old key:', key);
    localStorage.removeItem(key);
  }
});
```

---

## ✨ Visual Confirmation

### Admin (Purple + Dark):
- Navigation links: Purple
- Buttons: Purple
- Background: Dark gray
- Text: Light/White

### User (Blue + Light):
- Navigation links: Blue
- Buttons: Blue
- Background: White
- Text: Dark/Black

### Technician (Green + Light - if set):
- Navigation links: Green
- Buttons: Green
- Background: White
- Text: Dark/Black

---

## 📝 Quick Reference

| What | Where Stored | Example |
|------|--------------|---------|
| Admin Color | `themeColor_ADMIN` | `'purple'` |
| Admin Mode | `themeMode_ADMIN` | `'dark'` |
| User Color | `themeColor_USER` | `'blue'` |
| User Mode | `themeMode_USER` | `'light'` |
| Tech Color | `themeColor_TECHNICIAN` | `'green'` |
| Tech Mode | `themeMode_TECHNICIAN` | `'light'` |

---

## ✅ Files Modified

1. `client/src/contexts/ThemeContext.tsx`
   - Changed theme color from per-user to per-role
   - Changed theme mode from global to per-role

2. `client/src/app/layout/AppLayout.tsx`
   - Removed conflicting theme application
   - Now delegated to ThemeContext

---

**Status:** ✅ Ready to test!

Try logging in as different roles and setting different themes. Each role should maintain its own independent theme preference! 🎉
