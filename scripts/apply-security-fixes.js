// Script to apply final security fixes

const fs = require('fs');
const path = require('path');

// Fix 1: Add environment validation to index.ts
const indexPath = path.join(__dirname, '../server/src/index.ts');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add import after parseQuery import
if (!indexContent.includes('validateEnvironment')) {
  indexContent = indexContent.replace(
    "import { parseQuery } from './middleware/queryParser';",
    "import { parseQuery } from './middleware/queryParser';\nimport { validateEnvironment } from './lib/envValidation';\n\n// Validate environment variables before starting\nvalidateEnvironment();"
  );
}

// Fix 2: Remove WhatsApp token fallback
indexContent = indexContent.replace(
  /const verifyToken = process\.env\.WHATSAPP_VERIFY_TOKEN \|\| 'asset_app_webhook_verify_2024';[\s\S]*?if \(mode === 'subscribe' && token === verifyToken\) \{[\s\S]*?return res\.sendStatus\(403\);[\s\S]*?\}/,
  `const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (!verifyToken) {
      console.error('❌ WHATSAPP_VERIFY_TOKEN not configured');
      return res.sendStatus(500);
    }

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed - invalid token');
      return res.sendStatus(403);
    }`
);

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ Applied security fixes to index.ts');
