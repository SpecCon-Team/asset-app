// ===========================================
// DEBUG LIGHT MODE ISSUE
// ===========================================
// Run this in browser console to debug why light mode isn't working

console.clear();
console.log('🐛 DEBUG LIGHT MODE ISSUE\n');

// Check current user
const userStr = localStorage.getItem('user');
if (!userStr) {
  console.error('❌ NO USER LOGGED IN');
} else {
  const user = JSON.parse(userStr);
  console.log('✅ Current User:', user.email);
  console.log('   Role:', user.role);

  // Check system preference
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log('\n🖥️  SYSTEM PREFERENCE:');
  console.log('   System prefers dark mode:', systemPrefersDark);
  console.log('   ⚠️  This might be overriding your light mode choice!');

  // Check stored theme for this role
  const roleThemeModeKey = `themeMode_${user.role}`;
  const savedMode = localStorage.getItem(roleThemeModeKey);

  console.log('\n💾 STORED THEME:');
  console.log(`   ${roleThemeModeKey}:`, savedMode || '❌ NOT SET');

  if (!savedMode) {
    console.warn('   ⚠️  No theme saved for this role!');
    console.warn('   ⚠️  System preference will be used:', systemPrefersDark ? 'DARK' : 'LIGHT');
  }

  // Check actual DOM state
  const isDarkApplied = document.documentElement.classList.contains('dark');
  console.log('\n🌐 CURRENT DOM STATE:');
  console.log('   Dark class applied:', isDarkApplied);
  console.log('   Expected:', savedMode || (systemPrefersDark ? 'dark' : 'light'));

  // Check if they match
  if (savedMode === 'light' && isDarkApplied) {
    console.error('\n❌ PROBLEM FOUND!');
    console.error('   Saved mode: light');
    console.error('   But dark class is applied: true');
    console.log('\n🔧 FIX: Run this command to remove dark class:');
    console.log('   document.documentElement.classList.remove("dark");');
  } else if (savedMode === 'dark' && !isDarkApplied) {
    console.error('\n❌ PROBLEM FOUND!');
    console.error('   Saved mode: dark');
    console.error('   But dark class is NOT applied');
    console.log('\n🔧 FIX: Run this command to add dark class:');
    console.log('   document.documentElement.classList.add("dark");');
  } else {
    console.log('\n✅ Theme mode matches saved preference');
  }

  // Test: Manually set to light mode
  console.log('\n🧪 TEST: Set to LIGHT mode');
  console.log('Run these commands to force light mode:');
  console.log(`localStorage.setItem('themeMode_${user.role}', 'light');`);
  console.log('document.documentElement.classList.remove("dark");');
  console.log('window.location.reload();');

  // Test: Manually set to dark mode
  console.log('\n🧪 TEST: Set to DARK mode');
  console.log('Run these commands to force dark mode:');
  console.log(`localStorage.setItem('themeMode_${user.role}', 'dark');`);
  console.log('document.documentElement.classList.add("dark");');
  console.log('window.location.reload();');

  // Check appSettings
  console.log('\n🔍 CHECK OLD SETTINGS:');
  const appSettings = localStorage.getItem(`appSettings_${user.id}`);
  if (appSettings) {
    const settings = JSON.parse(appSettings);
    console.log('   appSettings theme:', settings.theme);
    if (settings.theme && settings.theme !== savedMode) {
      console.warn('   ⚠️  CONFLICT: appSettings theme differs from role-based theme!');
      console.warn(`   appSettings: ${settings.theme}`);
      console.warn(`   Role-based: ${savedMode}`);
    }
  }
}

console.log('\n📋 SUMMARY:');
console.log('If light mode is not working:');
console.log('1. Check if system preference is overriding (see above)');
console.log('2. Check if themeMode_ROLE is properly saved in localStorage');
console.log('3. Try manually setting light mode using the commands above');
console.log('4. Check browser console for any errors');

// Helper function
window.forceLightMode = function() {
  const user = JSON.parse(localStorage.getItem('user'));
  localStorage.setItem(`themeMode_${user.role}`, 'light');
  document.documentElement.classList.remove('dark');
  console.log('✅ Forced light mode for', user.role);
  console.log('Reloading page...');
  setTimeout(() => window.location.reload(), 500);
};

window.forceDarkMode = function() {
  const user = JSON.parse(localStorage.getItem('user'));
  localStorage.setItem(`themeMode_${user.role}`, 'dark');
  document.documentElement.classList.add('dark');
  console.log('✅ Forced dark mode for', user.role);
  console.log('Reloading page...');
  setTimeout(() => window.location.reload(), 500);
};

console.log('\n🛠️  HELPER FUNCTIONS:');
console.log('   forceLightMode() - Force light mode and reload');
console.log('   forceDarkMode() - Force dark mode and reload');
