// ===========================================
// THEME CLEANUP SCRIPT
// ===========================================
// Run this in your browser console (F12) to clean up old theme storage
// and ensure role-based theme system works correctly

console.clear();
console.log('🧹 THEME CLEANUP SCRIPT\n');

// Get current user
const userStr = localStorage.getItem('user');
if (!userStr) {
  console.error('❌ NO USER LOGGED IN');
  console.log('Please login first, then run this script again.');
} else {
  const user = JSON.parse(userStr);
  console.log('✅ Logged in as:', user.email);
  console.log('   Role:', user.role);

  // Step 1: Check for old theme keys
  console.log('\n🔍 CHECKING FOR OLD THEME KEYS...\n');

  const oldGlobalThemeColor = localStorage.getItem('themeColor');
  const oldGlobalThemeMode = localStorage.getItem('themeMode');
  const userAppSettings = localStorage.getItem(`appSettings_${user.id}`);

  let needsCleanup = false;

  if (oldGlobalThemeColor) {
    console.log('   Found old global themeColor:', oldGlobalThemeColor);
    needsCleanup = true;
  }

  if (oldGlobalThemeMode) {
    console.log('   Found old global themeMode:', oldGlobalThemeMode);
    needsCleanup = true;
  }

  if (userAppSettings) {
    const settings = JSON.parse(userAppSettings);
    if (settings.theme) {
      console.log('   Found theme in appSettings:', settings.theme);
      needsCleanup = true;
    }
  }

  // Check for old user-specific theme color keys
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('themeColor_c') && key !== `themeColor_${user.role}`) {
      console.log('   Found old user-specific themeColor:', key);
      needsCleanup = true;
    }
  });

  if (!needsCleanup) {
    console.log('   ✅ No old keys found! Theme storage is clean.\n');
  } else {
    console.log('\n⚠️  OLD KEYS FOUND - MIGRATION NEEDED\n');

    // Step 2: Migrate to role-based storage
    console.log('🔄 MIGRATING TO ROLE-BASED STORAGE...\n');

    // Migrate theme color
    const roleThemeColorKey = `themeColor_${user.role}`;
    const currentRoleColor = localStorage.getItem(roleThemeColorKey);

    if (!currentRoleColor) {
      // Try to find color from old storage
      let colorToMigrate = oldGlobalThemeColor || 'blue';

      // Check user-specific color
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('themeColor_c')) {
          colorToMigrate = localStorage.getItem(key) || colorToMigrate;
        }
      });

      console.log(`   Setting ${roleThemeColorKey} = ${colorToMigrate}`);
      localStorage.setItem(roleThemeColorKey, colorToMigrate);
    } else {
      console.log(`   ✅ ${roleThemeColorKey} already set:`, currentRoleColor);
    }

    // Migrate theme mode
    const roleThemeModeKey = `themeMode_${user.role}`;
    const currentRoleMode = localStorage.getItem(roleThemeModeKey);

    if (!currentRoleMode) {
      // Try to find mode from old storage
      let modeToMigrate = oldGlobalThemeMode;

      if (!modeToMigrate && userAppSettings) {
        const settings = JSON.parse(userAppSettings);
        if (settings.theme === 'dark') {
          modeToMigrate = 'dark';
        } else if (settings.theme === 'light') {
          modeToMigrate = 'light';
        }
      }

      if (!modeToMigrate) {
        // Use system preference
        modeToMigrate = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      console.log(`   Setting ${roleThemeModeKey} = ${modeToMigrate}`);
      localStorage.setItem(roleThemeModeKey, modeToMigrate);
    } else {
      console.log(`   ✅ ${roleThemeModeKey} already set:`, currentRoleMode);
    }

    // Step 3: Remove old keys
    console.log('\n🗑️  REMOVING OLD KEYS...\n');

    if (oldGlobalThemeColor) {
      localStorage.removeItem('themeColor');
      console.log('   ✅ Removed global themeColor');
    }

    if (oldGlobalThemeMode) {
      localStorage.removeItem('themeMode');
      console.log('   ✅ Removed global themeMode');
    }

    // Remove old user-specific theme color keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('themeColor_c') && key !== `themeColor_${user.role}`) {
        localStorage.removeItem(key);
        console.log(`   ✅ Removed old key: ${key}`);
      }
    });

    console.log('\n✅ MIGRATION COMPLETE!\n');
  }

  // Step 4: Display current role-based theme
  console.log('📊 CURRENT ROLE-BASED THEME:\n');

  const roleThemeColorKey = `themeColor_${user.role}`;
  const roleThemeModeKey = `themeMode_${user.role}`;
  const currentColor = localStorage.getItem(roleThemeColorKey);
  const currentMode = localStorage.getItem(roleThemeModeKey);

  console.log(`   Role: ${user.role}`);
  console.log(`   Color: ${currentColor || '❌ not set (will default to blue)'}`);
  console.log(`   Mode: ${currentMode || '❌ not set (will use system preference)'}`);

  // Step 5: Apply theme
  console.log('\n🎨 APPLYING THEME...\n');

  const isDarkMode = currentMode === 'dark';
  if (isDarkMode && !document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.add('dark');
    console.log('   ✅ Applied dark mode');
  } else if (!isDarkMode && document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    console.log('   ✅ Applied light mode');
  } else {
    console.log('   ✅ Theme mode already correct');
  }

  console.log('\n🔄 RELOADING PAGE TO APPLY CHANGES...\n');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}
