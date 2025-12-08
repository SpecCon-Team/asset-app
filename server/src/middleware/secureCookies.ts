import { Request, Response, NextFunction } from 'express';

/**
 * Secure Cookie Configuration
 * Implements comprehensive cookie security settings
 */

// Secure cookie options
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true, // Prevent XSS via document.cookie
  secure: process.env.NODE_ENV === 'production', // Only send over HTTPS
  sameSite: 'strict' as const, // Prevent CSRF
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/', // Available site-wide
  domain: process.env.COOKIE_DOMAIN, // Restrict to specific domain
  // Additional security flags
  encode: true, // URL encode cookie values
  signed: true, // Sign cookies for integrity
  // Partitioned cookies (Chrome 114+)
  partitioned: process.env.NODE_ENV === 'production'
};

// Session cookie options (more restrictive)
export const SESSION_COOKIE_OPTIONS = {
  ...SECURE_COOKIE_OPTIONS,
  maxAge: 8 * 60 * 60 * 1000, // 8 hours for sessions
  rolling: false, // Don't reset expiration on every request
  // Additional session security
  overwrite: true, // Overwrite existing cookies
  priority: 'high' // Cookie priority
};

// CSRF cookie options (shorter duration)
export const CSRF_COOKIE_OPTIONS = {
  ...SECURE_COOKIE_OPTIONS,
  maxAge: 60 * 60 * 1000, // 1 hour for CSRF tokens
  path: '/api', // Only available to API endpoints
  // CSRF specific settings
  overwrite: true,
  priority: 'high'
};

// Set secure cookie with additional security
export function setSecureCookie(
  res: Response,
  name: string,
  value: string,
  options: Partial<typeof SECURE_COOKIE_OPTIONS> = {}
): void {
  const finalOptions = { ...SECURE_COOKIE_OPTIONS, ...options };
  
  // Add security headers
  res.cookie(name, value, finalOptions);
  
  // Log cookie setting for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('🍪 Secure cookie set:', {
      name,
      secure: finalOptions.secure,
      httpOnly: finalOptions.httpOnly,
      sameSite: finalOptions.sameSite,
      maxAge: finalOptions.maxAge
    });
  }
}

// Clear cookie with security
export function clearSecureCookie(
  res: Response,
  name: string,
  options: Partial<typeof SECURE_COOKIE_OPTIONS> = {}
): void {
  const clearOptions = {
    ...SECURE_COOKIE_OPTIONS,
    ...options,
    maxAge: -1, // Immediate expiration
    expires: new Date(0) // Set to past date
  };
  
  res.cookie(name, '', clearOptions);
  
  console.log('🗑️  Secure cookie cleared:', { name });
}

// Validate cookie security
export function validateCookieSecurity(req: Request): {
  secure: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let secure = true;
  
  // Check for secure flag in production
  if (process.env.NODE_ENV === 'production') {
    const cookies = req.headers.cookie || '';
    
    // Check if cookies are being sent over HTTPS
    if (!req.secure && cookies) {
      issues.push('Cookies sent over HTTP in production');
      secure = false;
    }
    
    // Check for secure flag in cookies
    if (cookies.includes('Secure') === false) {
      // This is a simplified check
      issues.push('Cookies may not have Secure flag');
    }
  }
  
  // Check for SameSite attribute
  const userAgent = req.get('User-Agent') || '';
  if (userAgent.includes('Chrome') || userAgent.includes('Firefox')) {
    // Modern browsers should enforce SameSite
    // This is a simplified check
  }
  
  // Check for HttpOnly flag
  // This can't be directly checked on server side, but we can check context
  
  return { secure, issues };
}

// Cookie rotation middleware
export function cookieRotation(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  
  if (user && !req.session?.cookieRotated) {
    // Rotate session cookie on authentication
    const sessionId = generateSecureSessionId();
    
    res.cookie('sessionId', sessionId, SESSION_COOKIE_OPTIONS);
    req.session.cookieRotated = true;
    req.session.sessionId = sessionId;
    
    console.log('🔄 Session cookie rotated for user:', user.id);
  }
  
  next();
}

// Generate secure session ID
function generateSecureSessionId(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

// Cookie integrity verification
export function verifyCookieIntegrity(
  cookieValue: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(cookieValue)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Set signed cookie with integrity
export function setSignedCookie(
  res: Response,
  name: string,
  value: string,
  secret: string,
  options: Partial<typeof SECURE_COOKIE_OPTIONS> = {}
): void {
  const crypto = require('crypto');
  
  // Generate signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('hex');
  
  // Combine value and signature
  const signedValue = `${value}.${signature}`;
  
  setSecureCookie(res, name, signedValue, {
    ...options,
    // Ensure signed cookies have additional security
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  
  console.log('🔐 Signed cookie set:', { name, signed: true });
}

// Get and verify signed cookie
export function getSignedCookie(
  req: Request,
  name: string,
  secret: string
): { valid: boolean; value?: string } {
  const cookieValue = req.cookies?.[name];
  
  if (!cookieValue) {
    return { valid: false };
  }
  
  const parts = cookieValue.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }
  
  const [value, signature] = parts;
  const isValid = verifyCookieIntegrity(value, signature, secret);
  
  if (!isValid) {
    console.warn('🚨 Invalid signed cookie detected:', {
      name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  return { valid: isValid, value: isValid ? value : undefined };
}

// Anti-tampering middleware
export function cookieTamperingDetection(req: Request, res: Response, next: NextFunction): void {
  const cookies = req.cookies || {};
  
  // Check for suspicious cookie modifications
  for (const [name, value] of Object.entries(cookies)) {
    // Check for unusual characters
    if (/[<>\"'\\]/.test(value)) {
      console.warn('🚨 Suspicious cookie content detected:', {
        name,
        value: value.substring(0, 50) + '...',
        ip: req.ip
      });
      
      // Clear suspicious cookie
      clearSecureCookie(res, name);
    }
    
    // Check for oversized cookies
    if (value.length > 4096) { // 4KB limit
      console.warn('🚨 Oversized cookie detected:', {
        name,
        size: value.length,
        ip: req.ip
      });
      
      clearSecureCookie(res, name);
    }
  }
  
  next();
}

console.log('🍪 Secure cookie configuration initialized');