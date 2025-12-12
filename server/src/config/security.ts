/**
 * Comprehensive Security Configuration
 * Centralized security settings for AssetTrack Pro
 */

export const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    enabled: true,
    reportOnly: false,
    reportUri: '/api/security/csp-report',
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Nonces added dynamically
      styleSrc: ["'self'"], // Nonces added dynamically
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: true
    }
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    tokenName: 'csrfToken',
    headerName: 'X-CSRF-Token',
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // Session Security
  session: {
    enabled: true,
    secretLength: 32,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    rolling: false,
    resave: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    },
    fixationProtection: true,
    concurrentLimit: 3,
    timeoutWarning: 30 * 60 * 1000 // 30 minutes
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: {
      global: 1000,
      auth: 30,
      upload: 10,
      api: 500,
      webhook: 100
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    progressiveDelay: {
      enabled: true,
      threshold: 30,
      maxDelay: 2000 // 2 seconds
    }
  },

  // DDoS Protection
  ddos: {
    enabled: true,
    thresholds: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      suspiciousThreshold: 10,
      maxConcurrentConnections: 50,
      riskScoreThreshold: 75
    },
    reputation: {
      enabled: true,
      decayRate: 0.1, // Score recovery rate
      violationPenalty: 40,
      blockThreshold: 20
    },
    attackDetection: {
      httpFlood: true,
      bruteForce: true,
      slowloris: true,
      suspiciousPatterns: true
    }
  },

  // File Upload Security
  fileUpload: {
    enabled: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 5,
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/zip', 'application/x-rar-compressed'
    ],
    blockedExtensions: [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.dll',
      '.ps1', '.psm1', '.psd1', '.ps1xml', '.psc1', '.psd1xml'
    ],
    virusScanning: {
      enabled: true,
      scanSignatures: true,
      quarantineSuspicious: true
    },
    sanitization: {
      enabled: true,
      scanContent: true,
      removeMetadata: true
    }
  },

  // Input Validation & Sanitization
  input: {
    enabled: true,
    xssProtection: true,
    sqlInjectionProtection: true,
    htmlSanitization: true,
    parameterPollutionProtection: true,
    maxFieldLength: {
      text: 10000,
      textarea: 100000,
      number: 20,
      email: 254,
      url: 2048
    }
  },

  // Authentication Security
  auth: {
    passwordPolicy: {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
      preventUserInfo: true,
      strengthCheck: true
    },
    accountLockout: {
      enabled: true,
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      progressiveDelay: true
    },
    twoFactor: {
      enabled: true,
      issuer: 'AssetTrack Pro',
      window: 30, // 30 seconds
      backupCodes: 10,
      backupCodeLength: 8
    },
    sessionRotation: {
      enabled: true,
      rotateOnLogin: true,
      rotateOnPrivilegeChange: true
    }
  },

  // Logging & Monitoring
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    auditLog: {
      enabled: true,
      includeRequestBody: false,
      includeResponseBody: false,
      includeHeaders: false,
      retentionDays: 90,
      encryption: {
        enabled: process.env.LOG_ENCRYPTION === 'true',
        algorithm: 'aes-256-gcm',
        keyRotation: true
      },
      integrity: {
        enabled: true,
        hashing: true,
        signing: process.env.LOG_SIGNING === 'true'
      }
    },
    securityEvents: {
      enabled: true,
      logLevel: 'warning',
      realTimeAlerts: true,
      aggregation: {
        enabled: true,
        windowMs: 5 * 60 * 1000 // 5 minutes
      }
    }
  },

  // HTTPS & TLS
  https: {
    enabled: process.env.NODE_ENV === 'production',
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    tls: {
      minVersion: 'TLSv1.2',
      cipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
      ]
    }
  },

  // Headers Security
  headers: {
    enabled: true,
    customHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
      'Cross-Origin-Embedder-Policy': 'false',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    }
  },

  // Webhook Security
  webhooks: {
    enabled: true,
    signatureVerification: {
      enabled: true,
      algorithm: 'sha256',
      headerName: 'X-Hub-Signature-256',
      secretEnvVar: 'WHATSAPP_VERIFY_TOKEN'
    },
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    },
    ipWhitelist: process.env.WEBHOOK_IP_WHITELIST?.split(',') || []
  },

  // Database Security
  database: {
    encryption: {
      enabled: process.env.DB_ENCRYPTION === 'true',
      algorithm: 'aes-256-gcm',
      keyRotation: true
    },
    connection: {
      ssl: process.env.DB_SSL === 'true',
      timeout: 30000,
      maxConnections: 100,
      connectionTimeout: 10000
    },
    query: {
      parameterized: true,
      timeout: 30000,
      limit: 1000
    }
  },

  // Environment Security
  environment: {
    production: process.env.NODE_ENV === 'production',
    debugMode: process.env.DEBUG_MODE === 'true',
    securityHeaders: process.env.DISABLE_SECURITY !== 'true',
    monitoring: process.env.ENABLE_MONITORING !== 'false'
  }
};

// Security feature flags
export const SECURITY_FEATURES = {
  CSP_ENABLED: SECURITY_CONFIG.csp.enabled,
  CSRF_PROTECTION_ENABLED: SECURITY_CONFIG.csrf.enabled,
  SESSION_SECURITY_ENABLED: SECURITY_CONFIG.session.enabled,
  RATE_LIMITING_ENABLED: SECURITY_CONFIG.rateLimit.enabled,
  DDOS_PROTECTION_ENABLED: SECURITY_CONFIG.ddos.enabled,
  FILE_UPLOAD_SECURITY_ENABLED: SECURITY_CONFIG.fileUpload.enabled,
  INPUT_SANITIZATION_ENABLED: SECURITY_CONFIG.input.enabled,
  AUTH_SECURITY_ENABLED: SECURITY_CONFIG.auth.accountLockout.enabled,
  LOGGING_ENABLED: SECURITY_CONFIG.logging.enabled,
  HTTPS_ENABLED: SECURITY_CONFIG.https.enabled,
  HEADERS_SECURITY_ENABLED: SECURITY_CONFIG.headers.enabled,
  WEBHOOK_SECURITY_ENABLED: SECURITY_CONFIG.webhooks.enabled,
  DATABASE_SECURITY_ENABLED: SECURITY_CONFIG.database.encryption.enabled
};

// Security validation functions
export const validateSecurityConfig = (): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  if (SECURITY_CONFIG.environment.production && !SECURITY_CONFIG.https.enabled) {
    warnings.push('HTTPS should be enabled in production');
  }
  
  if (SECURITY_CONFIG.environment.production && SECURITY_CONFIG.environment.debugMode) {
    warnings.push('Debug mode should be disabled in production');
  }
  
  if (!SECURITY_CONFIG.auth.passwordPolicy.strengthCheck) {
    warnings.push('Password strength checking should be enabled');
  }
  
  if (!SECURITY_CONFIG.session.fixationProtection) {
    warnings.push('Session fixation protection should be enabled');
  }
  
  if (!SECURITY_CONFIG.csrf.enabled) {
    warnings.push('CSRF protection should be enabled');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
};

export default SECURITY_CONFIG;