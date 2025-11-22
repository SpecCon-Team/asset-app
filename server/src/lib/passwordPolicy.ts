import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import { prisma } from './prisma';

/**
 * Enhanced Password Policy System
 * Implements comprehensive password security requirements
 */

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minStrengthScore: number; // 0-4 (zxcvbn score)
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  historyCount: number; // Number of previous passwords to check
  maxAge: number; // Days until password expires (0 = never)
  preventReuse: boolean;
}

const DEFAULT_POLICY: PasswordPolicyConfig = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minStrengthScore: 2,
  preventCommonPasswords: true,
  preventUserInfo: true,
  historyCount: 5,
  maxAge: 90,
  preventReuse: true
};

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', '111111', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123',
  'football', 'jesus', 'michael', 'ninja', 'mustang'
];

// Keyboard patterns to detect
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', '123456', 'qwertyuiop',
  'asdfghjkl', 'zxcvbnm', '1qaz2wsx', 'qazwsx'
];

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  userInputs: string[] = [],
  policy: Partial<PasswordPolicyConfig> = {}
): PasswordValidationResult {
  const fullPolicy = { ...DEFAULT_POLICY, ...policy };
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check minimum length
  if (password.length < fullPolicy.minLength) {
    errors.push(`Password must be at least ${fullPolicy.minLength} characters long`);
  }

  // Check character requirements
  if (fullPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (fullPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (fullPolicy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (fullPolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  if (fullPolicy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
      errors.push('Password contains commonly used word or pattern');
      suggestions.push('Avoid using common passwords or dictionary words');
    }
  }

  // Check for keyboard patterns
  const lowerPassword = password.toLowerCase();
  if (KEYBOARD_PATTERNS.some(pattern => lowerPassword.includes(pattern))) {
    warnings.push('Password contains keyboard pattern');
    suggestions.push('Avoid using keyboard patterns like "qwerty" or "123456"');
  }

  // Check for user information
  if (fullPolicy.preventUserInfo && userInputs.length > 0) {
    for (const input of userInputs) {
      if (input && password.toLowerCase().includes(input.toLowerCase())) {
        errors.push('Password must not contain personal information');
        suggestions.push('Avoid using your name, email, or other personal info');
        break;
      }
    }
  }

  // Check password strength using zxcvbn
  const strengthResult = zxcvbn(password, userInputs);
  const score = strengthResult.score;

  if (score < fullPolicy.minStrengthScore) {
    errors.push(`Password is too weak (strength: ${score}/4, required: ${fullPolicy.minStrengthScore}/4)`);

    if (strengthResult.feedback.warning) {
      warnings.push(strengthResult.feedback.warning);
    }

    if (strengthResult.feedback.suggestions) {
      suggestions.push(...strengthResult.feedback.suggestions);
    }
  }

  // Additional suggestions
  if (password.length < 16) {
    suggestions.push('Consider using a longer password (16+ characters) for better security');
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    suggestions.push('Mix uppercase and lowercase letters');
  }

  return {
    valid: errors.length === 0,
    score,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Check if password has been reused
 */
export async function checkPasswordHistory(
  userId: string,
  newPassword: string,
  policy: Partial<PasswordPolicyConfig> = {}
): Promise<boolean> {
  if (!policy.preventReuse && policy.preventReuse !== undefined) {
    return false; // Reuse allowed
  }

  const fullPolicy = { ...DEFAULT_POLICY, ...policy };

  try {
    // Get user's password history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHistory: true }
    });

    if (!user || !user.passwordHistory) {
      return false; // No history, not reused
    }

    // Parse password history
    const history: string[] = JSON.parse(user.passwordHistory);

    // Check last N passwords
    const recentPasswords = history.slice(-fullPolicy.historyCount);

    for (const oldPasswordHash of recentPasswords) {
      const matches = await bcrypt.compare(newPassword, oldPasswordHash);
      if (matches) {
        return true; // Password was reused
      }
    }

    return false; // Not reused
  } catch (error) {
    console.error('Error checking password history:', error);
    return false;
  }
}

/**
 * Store password in history
 */
export async function addPasswordToHistory(
  userId: string,
  passwordHash: string,
  policy: Partial<PasswordPolicyConfig> = {}
): Promise<void> {
  const fullPolicy = { ...DEFAULT_POLICY, ...policy };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHistory: true }
    });

    if (!user) return;

    // Parse existing history
    let history: string[] = [];
    if (user.passwordHistory) {
      try {
        history = JSON.parse(user.passwordHistory);
      } catch (e) {
        history = [];
      }
    }

    // Add new password hash
    history.push(passwordHash);

    // Keep only last N passwords
    if (history.length > fullPolicy.historyCount) {
      history = history.slice(-fullPolicy.historyCount);
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHistory: JSON.stringify(history) }
    });
  } catch (error) {
    console.error('Error updating password history:', error);
  }
}

/**
 * Check if password has expired
 */
export async function isPasswordExpired(
  userId: string,
  policy: Partial<PasswordPolicyConfig> = {}
): Promise<boolean> {
  const fullPolicy = { ...DEFAULT_POLICY, ...policy };

  if (fullPolicy.maxAge === 0) {
    return false; // Password never expires
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { updatedAt: true }
    });

    if (!user) return false;

    const daysSinceChange = Math.floor(
      (Date.now() - user.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    return daysSinceChange >= fullPolicy.maxAge;
  } catch (error) {
    console.error('Error checking password expiry:', error);
    return false;
  }
}

/**
 * Generate a strong random password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Get password policy for display
 */
export function getPasswordPolicy(policy: Partial<PasswordPolicyConfig> = {}): PasswordPolicyConfig {
  return { ...DEFAULT_POLICY, ...policy };
}

/**
 * Check password against Have I Been Pwned database (optional)
 * Requires network access - use carefully
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  count?: number;
}> {
  try {
    // Hash password with SHA-1
    const hash = require('crypto')
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();

    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Query HIBP API (k-anonymity model)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();

    // Check if hash suffix appears in results
    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return {
          breached: true,
          count: parseInt(count, 10)
        };
      }
    }

    return { breached: false };
  } catch (error) {
    console.error('Error checking password breach:', error);
    return { breached: false }; // Fail open - don't block if API is unavailable
  }
}

// Export default policy for reference
export const PASSWORD_POLICY = DEFAULT_POLICY;
