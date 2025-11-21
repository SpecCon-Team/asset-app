import crypto from 'crypto';

/**
 * Database Field Encryption Module
 * Provides AES-256-GCM encryption for sensitive database fields
 */

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Get encryption key from environment or generate a secure one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_KEY must be set in production environment');
}

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a string value
 * Returns base64-encoded string containing salt, iv, encrypted data, and auth tag
 */
export function encrypt(text: string): string {
  if (!text) {
    return '';
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from encryption key + salt
    const key = deriveKey(ENCRYPTION_KEY || 'default-dev-key-change-me', salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine salt + iv + encrypted + tag
    const combined = Buffer.concat([
      salt,
      iv,
      Buffer.from(encrypted, 'hex'),
      tag
    ]);

    // Return as base64
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 * Expects base64-encoded string containing salt, iv, encrypted data, and auth tag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH, combined.length - TAG_LENGTH);

    // Derive key from encryption key + salt
    const key = deriveKey(ENCRYPTION_KEY || 'default-dev-key-change-me', salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt sensitive fields in an object
 * @param obj Object containing fields to encrypt
 * @param fields Array of field names to encrypt
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const encrypted = { ...obj };

  for (const field of fields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field] as string) as any;
    }
  }

  return encrypted;
}

/**
 * Decrypt sensitive fields in an object
 * @param obj Object containing encrypted fields
 * @param fields Array of field names to decrypt
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const decrypted = { ...obj };

  for (const field of fields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field] as string) as any;
      } catch (error) {
        // If decryption fails, field might not be encrypted
        console.warn(`Failed to decrypt field ${String(field)}, keeping original value`);
      }
    }
  }

  return decrypted;
}

/**
 * Hash a value using SHA-256 (one-way, for comparison only)
 * Useful for storing values that need to be matched but not retrieved
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Verify a value against a hash
 */
export function verifyHash(value: string, hashedValue: string): boolean {
  const valueHash = hash(value);
  return crypto.timingSafeEqual(
    Buffer.from(valueHash),
    Buffer.from(hashedValue)
  );
}

/**
 * Generate a secure random encryption key
 * Use this once to generate ENCRYPTION_KEY for .env
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Mask sensitive data for display (e.g., credit cards, phone numbers)
 */
export function maskData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return value;
  }

  const masked = '*'.repeat(value.length - visibleChars);
  return masked + value.slice(-visibleChars);
}

/**
 * Example usage for encrypting user phone numbers
 */
export function encryptPhone(phone: string): string {
  return encrypt(phone);
}

/**
 * Example usage for decrypting user phone numbers
 */
export function decryptPhone(encryptedPhone: string): string {
  return decrypt(encryptedPhone);
}

/**
 * Encrypt credit card or payment info
 */
export function encryptPaymentInfo(cardNumber: string): {
  encrypted: string;
  last4: string;
} {
  return {
    encrypted: encrypt(cardNumber),
    last4: cardNumber.slice(-4) // Store last 4 digits unencrypted for display
  };
}

// Log encryption key status on startup
if (process.env.NODE_ENV === 'development' && !ENCRYPTION_KEY) {
  console.warn('⚠️  WARNING: Using default encryption key in development');
  console.warn('⚠️  Generate a secure key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  console.warn('⚠️  Add to .env as: ENCRYPTION_KEY="your_generated_key"');
}
