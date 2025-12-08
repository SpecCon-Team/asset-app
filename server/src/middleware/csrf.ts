import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection with Double Submit Cookie Pattern
 * Implements robust CSRF protection using synchronizer token pattern
 */

// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Set CSRF cookie and token
export function setCSRFProtection(req: Request, res: Response, next: NextFunction): void {
  // Get existing token from cookie or generate new one
  const existingToken = req.cookies?.csrfToken;
  let token = existingToken;
  
  if (!token) {
    token = generateCSRFToken();
    
    // Set HTTP-only cookie with SameSite=Strict
    res.cookie('csrfToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });
  }
  
  // Store token in request for validation
  (req as any).csrfToken = token;
  
  next();
}

// Validate CSRF token for state-changing requests
export function validateCSRFToken(req: Request, res: Response, next: NextFunction): void {
  // Skip validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for login endpoint to allow basic authentication
  if (req.path === '/auth/login' || req.path === '/auth/verify-2fa-login') {
    return next();
  }
  
  // Skip CSRF for tickets endpoint to allow ticket creation
  if (req.path === '/tickets') {
    return next();
  }
  
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get('X-CSRF-Token') || req.body?.csrfToken;
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    console.warn('🚨 CSRF Protection - Invalid token:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      cookieToken: cookieToken ? 'present' : 'missing',
      headerToken: headerToken ? 'present' : 'missing'
    });
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'CSRF token validation failed',
      code: 'CSRF_INVALID'
    });
  }
  
  next();
}

// Get CSRF token for client-side use
export function getCSRFToken(req: Request): string {
  return (req as any).csrfToken || '';
}

// Refresh CSRF token
export function refreshCSRFToken(req: Request, res: Response): void {
  const newToken = generateCSRFToken();
  
  res.cookie('csrfToken', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  });
  
  res.json({ csrfToken: newToken });
}