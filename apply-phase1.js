const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../server/src/index.ts');
let content = fs.readFileSync(indexPath, 'utf8');

// Fix 1: Add environment validation import after line 47
const importLine = "import { parseQuery } from './middleware/queryParser';";
const newImports = `import { parseQuery } from './middleware/queryParser';
import { validateEnvironment } from './lib/envValidation';

// Validate environment variables before starting
validateEnvironment();`;

content = content.replace(importLine, newImports);

// Fix 2: Remove WhatsApp token fallback (line 72)
const oldWhatsAppCode = `const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'asset_app_webhook_verify_2024';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed:', {
        expectedToken: verifyToken,
        receivedMode: mode
      });
      return res.sendStatus(403);
    }`;

const newWhatsAppCode = `const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
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
    }`;

content = content.replace(oldWhatsAppCode, newWhatsAppCode);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('✅ Phase 1 security fixes applied successfully!');
console.log('   - Added environment validation');
console.log('   - Removed weak WhatsApp token fallback');
