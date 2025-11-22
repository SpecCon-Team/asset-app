import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateToken() {
  console.log('🔑 Update WhatsApp Access Token\n');
  console.log('━'.repeat(60));
  console.log('\n⚠️  Your current token has expired!\n');
  console.log('To get a new token:');
  console.log('1. Go to: https://developers.facebook.com/apps');
  console.log('2. Select your WhatsApp app');
  console.log('3. Navigate to: WhatsApp → API Setup');
  console.log('4. Copy the "Temporary access token"');
  console.log('\n━'.repeat(60));

  const newToken = await question('\nPaste your new access token here: ');

  if (!newToken || newToken.trim() === '') {
    console.log('\n❌ No token provided. Cancelled.');
    rl.close();
    return;
  }

  const token = newToken.trim();

  // Validate token format (should start with EAA)
  if (!token.startsWith('EAA')) {
    console.log('\n⚠️  Warning: Token doesn\'t look like a valid Meta access token.');
    console.log('   Valid tokens usually start with "EAA"');

    const confirm = await question('\nContinue anyway? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Cancelled.');
      rl.close();
      return;
    }
  }

  try {
    // Read current .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace the access token
    const tokenRegex = /WHATSAPP_ACCESS_TOKEN="[^"]*"/;

    if (tokenRegex.test(envContent)) {
      envContent = envContent.replace(tokenRegex, `WHATSAPP_ACCESS_TOKEN="${token}"`);
    } else {
      // Token not found, append it
      envContent += `\nWHATSAPP_ACCESS_TOKEN="${token}"\n`;
    }

    // Write back to .env
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('\n✅ Access token updated successfully!');
    console.log('\n━'.repeat(60));
    console.log('\n📝 Next steps:');
    console.log('1. Your server should auto-restart (tsx watch)');
    console.log('2. If not, restart manually: npm run dev');
    console.log('3. Send "Hi" to your WhatsApp Business number');
    console.log('4. You should receive the interactive menu!');
    console.log('\n🎉 Done!\n');

  } catch (error) {
    console.error('\n❌ Error updating .env file:', error.message);
    console.log('\nPlease update manually:');
    console.log('1. Open: server/.env');
    console.log('2. Find: WHATSAPP_ACCESS_TOKEN="..."');
    console.log('3. Replace with your new token');
    console.log('4. Save and restart server');
  } finally {
    rl.close();
  }
}

updateToken();
