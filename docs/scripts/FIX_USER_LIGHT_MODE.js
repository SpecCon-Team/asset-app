// ===========================================
// FIX USER LIGHT MODE
// ===========================================
// This script will force USER role to use light mode

console.clear();
console.log('🔧 FIX USER LIGHT MODE\n');

// Check current user
const userStr = localStorage.getItem('user');
if (!userStr) {
  console.error('❌ NOT LOGGED IN');
  console.log('Please login first');
} else {
  const user = JSON.parse(userStr);
  console.log('Current user:', user.email);
  console.log('Current role:', user.role);

  // Check what's currently stored for USER role
  console.log('\n📋 CURRENT STORAGE FOR USER ROLE:');
  const userColor = localStorage.getItem('themeColor_USER');
  const userMode = localStorage.getItem('themeMode_USER');
  console.log('themeColor_USER:', userColor || 'NOT SET');
  console.log('themeMode_USER:', userMode || 'NOT SET');

  // Force set USER to light mode
  console.log('\n🔧 FORCING USER TO LIGHT MODE...');
  localStorage.setItem('themeColor_USER', 'blue');
  localStorage.setItem('themeMode_USER', 'light');
  console.log('✅ Set themeColor_USER = blue');
  console.log('✅ Set themeMode_USER = light');

  // Also update appSettings if it exists
  const appSettingsKey = `appSettings_${user.id}`;
  const appSettings = localStorage.getItem(appSettingsKey);
  if (appSettings) {
    const settings = JSON.parse(appSettings);
    settings.theme = 'light';
    localStorage.setItem(appSettingsKey, JSON.stringify(settings));
    console.log('✅ Updated appSettings theme to light');
  }

  // Remove dark class immediately
  document.documentElement.classList.remove('dark');
  console.log('✅ Removed dark class from document');

  // Check if it worked
  console.log('\n📊 VERIFICATION:');
  console.log('themeMode_USER:', localStorage.getItem('themeMode_USER'));
  console.log('Dark class:', document.documentElement.classList.contains('dark'));

  console.log('\n🔄 Reloading page in 1 second...');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}
