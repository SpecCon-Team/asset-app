# Theme Debug Helper

## Run this in Browser Console (F12)

Copy and paste this entire script into your browser console to debug theme issues:

```javascript
// ===========================================
// THEME DEBUG HELPER
// ===========================================

console.clear();
console.log('🎨 THEME DEBUG HELPER\n');

// 1. Check if user is logged in
const userStr = localStorage.getItem('user');
if (!userStr) {
  console.error('❌ NO USER LOGGED IN');
  console.log('Please login first');
} else {
  const user = JSON.parse(userStr);
  console.log('✅ Logged in as:', user.email);
  console.log('   Role:', user.role);
  console.log('   ID:', user.id);

  // 2. Check current role's theme
  console.log('\n📋 CURRENT ROLE THEME:');
  const roleColor = localStorage.getItem(`themeColor_${user.role}`);
  const roleMode = localStorage.getItem(`themeMode_${user.role}`);
  console.log('   Color:', roleColor || '❌ not set');
  console.log('   Mode:', roleMode || '❌ not set');

  // 3. Check all role themes
  console.log('\n📊 ALL ROLE THEMES:');
  ['ADMIN', 'TECHNICIAN', 'USER'].forEach(role => {
    const color = localStorage.getItem(`themeColor_${role}`);
    const mode = localStorage.getItem(`themeMode_${role}`);
    console.log(`\n   ${role}:`);
    console.log(`      Color: ${color || 'not set'}`);
    console.log(`      Mode: ${mode || 'not set'}`);
  });

  // 4. Check DOM state
  console.log('\n🌐 DOM STATE:');
  const isDark = document.documentElement.classList.contains('dark');
  console.log('   Dark mode class:', isDark ? '✅ applied' : '❌ not applied');
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
  console.log('   Primary color:', primaryColor || 'not set');

  // 5. Check for old/conflicting keys
  console.log('\n🔍 OLD/CONFLICTING KEYS:');
  const oldKeys = [];
  Object.keys(localStorage).forEach(key => {
    if (key === 'themeColor' || key === 'themeMode') {
      oldKeys.push(key);
    }
    if (key.startsWith('themeColor_c') || key.startsWith('appSettings_')) {
      oldKeys.push(key);
    }
  });

  if (oldKeys.length > 0) {
    console.warn('   ⚠️  Found old keys:', oldKeys);
    console.log('   Run cleanupOldKeys() to remove them');
  } else {
    console.log('   ✅ No conflicting keys found');
  }
}

// 6. Helper functions
console.log('\n🛠️  HELPER FUNCTIONS AVAILABLE:');
console.log('   cleanupOldKeys() - Remove old theme storage');
console.log('   setAdminTheme(color, mode) - Set admin theme');
console.log('   setUserTheme(color, mode) - Set user theme');
console.log('   showAllThemes() - Display all role themes');

window.cleanupOldKeys = function() {
  console.log('🧹 Cleaning up old keys...');
  localStorage.removeItem('themeColor');
  localStorage.removeItem('themeMode');
  let count = 0;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('themeColor_c') || key.startsWith('appSettings_')) {
      localStorage.removeItem(key);
      count++;
    }
  });
  console.log(`✅ Removed ${count} old keys`);
  console.log('🔄 Reload page: window.location.reload()');
};

window.setAdminTheme = function(color = 'purple', mode = 'dark') {
  localStorage.setItem('themeColor_ADMIN', color);
  localStorage.setItem('themeMode_ADMIN', mode);
  console.log(`✅ Admin theme set to: ${color} + ${mode}`);
  console.log('🔄 Reload if logged in as admin');
};

window.setUserTheme = function(color = 'blue', mode = 'light') {
  localStorage.setItem('themeColor_USER', color);
  localStorage.setItem('themeMode_USER', mode);
  console.log(`✅ User theme set to: ${color} + ${mode}`);
  console.log('🔄 Reload if logged in as user');
};

window.showAllThemes = function() {
  console.log('\n📊 ALL ROLE THEMES:');
  ['ADMIN', 'TECHNICIAN', 'USER'].forEach(role => {
    const color = localStorage.getItem(`themeColor_${role}`);
    const mode = localStorage.getItem(`themeMode_${role}`);
    console.log(`${role}:`);
    console.log(`  Color: ${color || 'not set'}`);
    console.log(`  Mode: ${mode || 'not set'}`);
  });
};

console.log('\n✅ Debug helper loaded!');
console.log('💡 Run showAllThemes() to see current settings');
```

## Common Commands

### View All Themes
```javascript
showAllThemes()
```

### Clean Old Storage
```javascript
cleanupOldKeys()
```

### Manually Set Admin Theme
```javascript
setAdminTheme('purple', 'dark')
window.location.reload()
```

### Manually Set User Theme
```javascript
setUserTheme('blue', 'light')
window.location.reload()
```

### Force Dark Mode for Current Role
```javascript
const user = JSON.parse(localStorage.getItem('user'));
localStorage.setItem(`themeMode_${user.role}`, 'dark');
document.documentElement.classList.add('dark');
```

### Force Light Mode for Current Role
```javascript
const user = JSON.parse(localStorage.getItem('user'));
localStorage.setItem(`themeMode_${user.role}`, 'light');
document.documentElement.classList.remove('dark');
```

---

## Expected Output (Working Correctly)

```
🎨 THEME DEBUG HELPER

✅ Logged in as: admin@example.com
   Role: ADMIN
   ID: clxyz123

📋 CURRENT ROLE THEME:
   Color: purple
   Mode: dark

📊 ALL ROLE THEMES:

   ADMIN:
      Color: purple
      Mode: dark

   TECHNICIAN:
      Color: not set
      Mode: not set

   USER:
      Color: blue
      Mode: light

🌐 DOM STATE:
   Dark mode class: ✅ applied
   Primary color: #9333EA

🔍 OLD/CONFLICTING KEYS:
   ✅ No conflicting keys found
```

---

## If You See Problems

### Problem: "not set" for current role
**Fix:** Theme hasn't been set yet. Change it in the UI.

### Problem: "❌ not applied" for dark mode
**Fix:** Reload the page or run:
```javascript
window.location.reload()
```

### Problem: Old keys found
**Fix:** Run:
```javascript
cleanupOldKeys()
window.location.reload()
```

### Problem: Color not matching
**Fix:** Check if primary color CSS variable is set:
```javascript
console.log(getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
```
