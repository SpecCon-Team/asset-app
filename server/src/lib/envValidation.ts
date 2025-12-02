/**
 * Environment Variable Validation
 * Validates all required environment variables at application startup
 * Fails fast if critical variables are missing
 */

interface EnvironmentConfig {
  // Authentication
  JWT_SECRET: string;
  
  // Database
  DATABASE_URL: string;
  
  // WhatsApp Integration (optional in development)
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  
  // Encryption (required in production)
  ENCRYPTION_KEY?: string;
  
  // Email (optional but recommended)
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  MAILGUN_FROM_EMAIL?: string;
  EMAIL_USER?: string;
  EMAIL_PASSWORD?: string;
  
  // Client URL
  CLIENT_URL?: string;
  
  // Environment
  NODE_ENV?: string;
  PORT?: string;
}

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateEnvironment(): EnvironmentConfig {
  const env = process.env;
  const isProduction = env.NODE_ENV === 'production';
  const errors: string[] = [];

  // Always required variables
  const required: (keyof EnvironmentConfig)[] = [
    'JWT_SECRET',
    'DATABASE_URL'
  ];

  // Required in production only
  const productionRequired: (keyof EnvironmentConfig)[] = [
    'ENCRYPTION_KEY'
  ];

  // Check always-required variables
  for (const key of required) {
    if (!env[key] || env[key] === 'dev' || env[key] === 'your-secret-key') {
      errors.push(`${key} must be set and cannot use default/placeholder values`);
    }
  }

  // Check production-only required variables
  if (isProduction) {
    for (const key of productionRequired) {
      if (!env[key]) {
        errors.push(`${key} is required in production`);
      }
    }
  }

  // Validate JWT_SECRET strength
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security');
  }

  // Validate ENCRYPTION_KEY strength (if provided)
  if (env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length !== 64) {
    errors.push('ENCRYPTION_KEY must be exactly 64 characters (32 bytes hex)');
  }

  // Warn about missing optional but recommended variables
  const warnings: string[] = [];
  
  if (!env.SENDGRID_API_KEY && !env.MAILGUN_API_KEY && !env.EMAIL_USER) {
    warnings.push('No email service configured - email features will be disabled');
  }

  if (!env.CLIENT_URL) {
    warnings.push('CLIENT_URL not set - using default http://localhost:5173');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
    console.warn('');
  }

  // Throw if there are errors
  if (errors.length > 0) {
    console.error('\n❌ Environment Configuration Errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    throw new Error('Environment validation failed');
  }

  // Log success
  console.log('✅ Environment validation passed');

  return env as unknown as EnvironmentConfig;
}

/**
 * Validates WhatsApp configuration if WhatsApp features are enabled
 */
export function validateWhatsAppConfig(): void {
  const env = process.env;
  
  if (!env.WHATSAPP_VERIFY_TOKEN) {
    throw new Error('WHATSAPP_VERIFY_TOKEN is required for WhatsApp integration');
  }

  if (env.WHATSAPP_VERIFY_TOKEN.length < 20) {
    throw new Error('WHATSAPP_VERIFY_TOKEN must be at least 20 characters for security');
  }

  if (!env.WHATSAPP_PHONE_NUMBER_ID && !env.WHATSAPP_ACCESS_TOKEN) {
    console.warn('⚠️  WhatsApp sending features disabled (WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set)');
  }
}
