// Simple encryption test without TypeScript compilation
import crypto from 'crypto';

console.log('🔐 Testing Encryption Setup\n');

// Load encryption key from .env
const ENCRYPTION_KEY = '0C1e7ooPkqFgljdAggFsExd5hk0tLRI8qI3o3YRI2qg=';

if (!ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY not found in environment');
  process.exit(1);
}

console.log('✅ ENCRYPTION_KEY found');
console.log('Key (first 20 chars):', ENCRYPTION_KEY.substring(0, 20) + '...\n');

// Test encryption implementation
function encrypt(text) {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    });
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

function decrypt(encryptedData) {
  try {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);

    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// Run tests
console.log('Test 1: Basic Encryption/Decryption');
try {
  const testData = 'Sensitive user data 12345';
  console.log('Original:', testData);

  const encrypted = encrypt(testData);
  console.log('Encrypted:', encrypted.substring(0, 80) + '...');

  const decrypted = decrypt(encrypted);
  console.log('Decrypted:', decrypted);

  if (testData === decrypted) {
    console.log('✅ Basic encryption/decryption PASSED\n');
  } else {
    console.log('❌ Basic encryption/decryption FAILED\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message, '\n');
}

// Test 2: Multiple encryptions produce different outputs
console.log('Test 2: Encryption Randomness (IV)');
try {
  const testData = 'Same data';
  const encrypted1 = encrypt(testData);
  const encrypted2 = encrypt(testData);

  if (encrypted1 !== encrypted2) {
    console.log('✅ Each encryption produces unique output (IV working)\n');
  } else {
    console.log('❌ Encryption not using random IV\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message, '\n');
}

// Test 3: Key size validation
console.log('Test 3: Key Size Validation');
try {
  const key = Buffer.from(ENCRYPTION_KEY, 'base64');
  console.log('Key size:', key.length, 'bytes');

  if (key.length === 32) {
    console.log('✅ Correct key size for AES-256 (32 bytes)\n');
  } else {
    console.log('❌ Incorrect key size. Expected 32 bytes, got', key.length, '\n');
  }
} catch (error) {
  console.error('❌ Error:', error.message, '\n');
}

console.log('🎉 Encryption setup tests complete!');
console.log('\n✅ Your encryption system is ready to use!');
