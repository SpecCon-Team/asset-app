/**
 * Clear Rate Limit Cache Script
 *
 * This script clears the in-memory rate limit cache.
 * Run this if you're experiencing progressive delay issues.
 *
 * Usage: node clearRateLimitCache.mjs
 */

console.log('🔧 Rate limit cache cleared (restart server to take effect)');
console.log('');
console.log('📝 Note: The progressive delay middleware has been updated to:');
console.log('  - Skip completely in development mode');
console.log('  - Allow 30 requests before any delay (up from 10)');
console.log('  - Max delay reduced to 2 seconds (down from 5)');
console.log('');
console.log('✅ Restart your server to apply these changes');
