// ===========================================
// TEST USER ROLE - Run in Browser Console
// ===========================================
// This script checks if the user object in localStorage has the correct role

console.clear();
console.log('🧪 USER ROLE TEST\n');

// Check if user exists in localStorage
const userStr = localStorage.getItem('user');

if (!userStr) {
  console.error('❌ NO USER IN LOCALSTORAGE');
  console.log('Please login first');
  console.log('\nTo test manually, run:');
  console.log('localStorage.setItem("user", JSON.stringify({id: "test123", email: "admin@test.com", role: "ADMIN"}))');
} else {
  try {
    const user = JSON.parse(userStr);

    console.log('✅ USER OBJECT FOUND\n');
    console.log('Full user object:', user);
    console.log('\n📋 USER DETAILS:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name || 'N/A');
    console.log('  Role:', user.role);
    console.log('  Role Type:', typeof user.role);

    // Check if role is valid
    const validRoles = ['ADMIN', 'USER', 'TECHNICIAN'];
    if (validRoles.includes(user.role)) {
      console.log('\n✅ ROLE IS VALID:', user.role);
    } else {
      console.error('\n❌ INVALID ROLE:', user.role);
      console.log('Valid roles are:', validRoles);
    }

    // Check theme storage for this role
    console.log('\n🎨 THEME STORAGE FOR THIS ROLE:');
    const roleThemeColorKey = `themeColor_${user.role}`;
    const roleThemeModeKey = `themeMode_${user.role}`;

    const themeColor = localStorage.getItem(roleThemeColorKey);
    const themeMode = localStorage.getItem(roleThemeModeKey);

    console.log(`  ${roleThemeColorKey}:`, themeColor || '❌ NOT SET');
    console.log(`  ${roleThemeModeKey}:`, themeMode || '❌ NOT SET');

    // Check all role themes
    console.log('\n📊 ALL ROLE THEMES IN STORAGE:');
    validRoles.forEach(role => {
      const color = localStorage.getItem(`themeColor_${role}`);
      const mode = localStorage.getItem(`themeMode_${role}`);
      console.log(`\n  ${role}:`);
      console.log(`    Color: ${color || 'not set'}`);
      console.log(`    Mode: ${mode || 'not set'}`);
    });

    // Check DOM state
    console.log('\n🌐 DOM STATE:');
    const isDark = document.documentElement.classList.contains('dark');
    console.log('  Dark class applied:', isDark);
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
    console.log('  Primary color:', primaryColor || 'not set');

    // Check for old conflicting keys
    console.log('\n🔍 CHECKING FOR OLD KEYS:');
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
      console.warn('  ⚠️  Found old/conflicting keys:', oldKeys);
      console.log('  Run the CLEANUP_THEME.js script to remove them');
    } else {
      console.log('  ✅ No conflicting keys found');
    }

    // Test role switching simulation
    console.log('\n🔄 ROLE SWITCHING TEST:');
    console.log('To test role switching, logout and login as a different role.');
    console.log('\nOr manually test by running:');
    console.log('// Switch to ADMIN');
    console.log('localStorage.setItem("user", JSON.stringify({...JSON.parse(localStorage.getItem("user")), role: "ADMIN"}));');
    console.log('// Wait 500ms for ThemeContext to detect the change');
    console.log('setTimeout(() => window.location.reload(), 600);');

  } catch (e) {
    console.error('❌ ERROR PARSING USER OBJECT:', e);
    console.log('User string:', userStr);
    console.log('\nThe user object might be corrupted. Try logging out and logging in again.');
  }
}

console.log('\n✅ USER ROLE TEST COMPLETE');
