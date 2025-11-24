// ===========================================
// CHECK STORAGE - What's actually saved?
// ===========================================

console.clear();
console.log('🔍 CHECKING WHAT IS STORED\n');

// Check current user
const userStr = localStorage.getItem('user');
if (userStr) {
  const user = JSON.parse(userStr);
  console.log('Current user:', user.email);
  console.log('Current role:', user.role);
  console.log('');
}

// Check all role themes
console.log('📊 ALL STORED THEMES:\n');

['ADMIN', 'USER', 'TECHNICIAN'].forEach(role => {
  const color = localStorage.getItem(`themeColor_${role}`);
  const mode = localStorage.getItem(`themeMode_${role}`);

  console.log(`${role}:`);
  console.log(`  themeColor_${role}: ${color || '❌ NOT SAVED'}`);
  console.log(`  themeMode_${role}: ${mode || '❌ NOT SAVED'}`);
  console.log('');
});

// Check what DOM shows
console.log('🌐 CURRENT DOM STATE:');
console.log('  Dark class:', document.documentElement.classList.contains('dark'));
console.log('  Primary color:', getComputedStyle(document.documentElement).getPropertyValue('--color-primary'));
console.log('');

// Instructions to manually set themes
console.log('🔧 TO MANUALLY SET THEMES:');
console.log('');
console.log('// Set ADMIN to dark mode:');
console.log('localStorage.setItem("themeColor_ADMIN", "purple");');
console.log('localStorage.setItem("themeMode_ADMIN", "dark");');
console.log('');
console.log('// Set USER to light mode:');
console.log('localStorage.setItem("themeColor_USER", "blue");');
console.log('localStorage.setItem("themeMode_USER", "light");');
console.log('');
console.log('// Set TECHNICIAN to light mode:');
console.log('localStorage.setItem("themeColor_TECHNICIAN", "green");');
console.log('localStorage.setItem("themeMode_TECHNICIAN", "light");');
console.log('');
console.log('// Then reload:');
console.log('window.location.reload();');
