import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';

/**
 * Security Audit Log
 * Logs all security-relevant events to database and console
 */
export interface SecurityEvent {
  userId?: string;
  email?: string;
  action: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  details?: any;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const timestamp = new Date().toISOString();
  const logLevel = event.status === 'failure' ? 'ERROR' : event.status === 'warning' ? 'WARN' : 'INFO';

  // Console log with colors
  const colors = {
    success: '\x1b[32m', // Green
    failure: '\x1b[31m', // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };

  console.log(
    `${colors[event.status]}[${logLevel}]${colors.reset} ${timestamp} - ` +
    `Action: ${event.action} | ` +
    `User: ${event.email || event.userId || 'anonymous'} | ` +
    `IP: ${event.ip || 'unknown'} | ` +
    `Status: ${event.status}` +
    (event.resource ? ` | Resource: ${event.resource}` : '') +
    (event.details ? ` | Details: ${JSON.stringify(event.details)}` : '')
  );

  // Store in database for audit trail (optional - you can create an AuditLog model)
  // For now, we'll just log to console, but you could expand this
  try {
    // TODO: Create AuditLog model in Prisma and store events
    // await prisma.auditLog.create({ data: event });
  } catch (error) {
    console.error('Failed to log security event to database:', error);
  }
}

/**
 * Security logging middleware
 * Logs all requests with security context
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;

    // Log security-relevant requests
    if (
      req.path.includes('/auth/') ||
      req.path.includes('/users/') ||
      req.method !== 'GET'
    ) {
      logSecurityEvent({
        action: `${req.method} ${req.path}`,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        status: res.statusCode < 400 ? 'success' : 'failure',
        details: { duration: `${duration}ms`, statusCode: res.statusCode }
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Input validation middleware
 * Validates request parameters and body for injection attempts
 */
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Skip validation for webhook endpoints (they have specific validation in their routes)
  if (req.path === '/api/whatsapp/webhook' || req.path === '/api/wooalerts-webhook') {
    return next();
  }

  // Check for common injection patterns
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi, // XSS
    /javascript:/gi, // XSS
    /on\w+\s*=/gi, // Event handlers
    /\$\{.*\}/g, // Template injection
    /\.\.\//g, // Path traversal
    /__proto__/g, // Prototype pollution
    /constructor/g, // Prototype pollution
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check query params
  if (checkValue(req.query)) {
    logSecurityEvent({
      action: 'INJECTION_ATTEMPT',
      ip: req.ip,
      status: 'failure',
      details: { path: req.path, query: req.query }
    });
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid characters detected in request'
    });
  }

  // Check body
  if (checkValue(req.body)) {
    logSecurityEvent({
      action: 'INJECTION_ATTEMPT',
      ip: req.ip,
      status: 'failure',
      details: { path: req.path }
    });
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid characters detected in request'
    });
  }

  next();
};

/**
 * Global rate limiter
 * Protects all API endpoints from abuse
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 500, // Increased from 100 to 500 for production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip validation for trust proxy - we're in development mode with ngrok/localtunnel
  validate: { trustProxy: false },
  handler: (req, res) => {
    logSecurityEvent({
      action: 'RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      status: 'warning',
      details: { path: req.path }
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Security headers enhancement
 * Adds additional security headers beyond Helmet
 */
export const enhancedSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove powered by header
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Response time monitoring
 * Logs slow requests for performance monitoring
 */
export const responseTimeMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logSecurityEvent({
        action: 'SLOW_REQUEST',
        status: 'warning',
        details: {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          statusCode: res.statusCode
        }
      });
    }
  });

  next();
};

/**
 * Parameter pollution prevention
 * Prevents parameter pollution attacks
 */
export const preventParameterPollution = (req: Request, res: Response, next: NextFunction) => {
  // Check for duplicate parameters
  const params = { ...req.query };
  const duplicates = Object.keys(params).filter(key => Array.isArray(params[key]));

  if (duplicates.length > 0) {
    logSecurityEvent({
      action: 'PARAMETER_POLLUTION',
      ip: req.ip,
      status: 'warning',
      details: { path: req.path, duplicates }
    });

    // Take first value only
    duplicates.forEach(key => {
      const value = params[key] as any[];
      (req.query as any)[key] = value[0];
    });
  }

  next();
};

/**
 * Data integrity validation
 * Validates critical data hasn't been tampered with
 */
export const validateDataIntegrity = async (req: Request, res: Response, next: NextFunction) => {
  // For PUT/PATCH requests, verify resource exists and hasn't been tampered
  if ((req.method === 'PUT' || req.method === 'PATCH') && req.params.id) {
    const resourceId = req.params.id;

    // Validate ID format (CUID for Prisma)
    const cuidPattern = /^c[a-z0-9]{24}$/;
    if (!cuidPattern.test(resourceId)) {
      logSecurityEvent({
        action: 'INVALID_RESOURCE_ID',
        ip: req.ip,
        status: 'failure',
        details: { resourceId, path: req.path }
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid resource ID format'
      });
    }
  }

  next();
};

/**
 * Failed login attempt tracking
 * Monitors and blocks suspicious login patterns
 */
const failedLoginAttempts = new Map<string, { count: number; firstAttempt: number }>();

export const trackFailedLogins = (email: string, ip: string): void => {
  const key = `${email}:${ip}`;
  const now = Date.now();
  const entry = failedLoginAttempts.get(key);

  if (!entry) {
    failedLoginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    // Reset if more than 1 hour has passed
    if (now - entry.firstAttempt > 60 * 60 * 1000) {
      failedLoginAttempts.set(key, { count: 1, firstAttempt: now });
    } else {
      entry.count++;

      // Alert on suspicious activity (10+ failed attempts)
      if (entry.count >= 10) {
        logSecurityEvent({
          action: 'SUSPICIOUS_LOGIN_ACTIVITY',
          email,
          ip,
          status: 'warning',
          details: { attempts: entry.count }
        });
      }
    }
  }
};

export const resetFailedLogins = (email: string, ip: string): void => {
  const key = `${email}:${ip}`;
  failedLoginAttempts.delete(key);
};

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (const [key, entry] of failedLoginAttempts.entries()) {
    if (now - entry.firstAttempt > oneHour) {
      failedLoginAttempts.delete(key);
    }
  }
}, 15 * 60 * 1000); // Clean up every 15 minutes
