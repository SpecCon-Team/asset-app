import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Enhanced Security Middleware with Nonce-based CSP
 * Implements Content Security Policy with dynamic nonces for maximum security
 */

// Generate cryptographically secure nonce
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

// Middleware to add nonce to request and set CSP headers
export function enhancedCSPMiddleware(req: Request, res: Response, next: NextFunction): void {
  const nonce = generateNonce();
  
  // Store nonce in request for use in templates
  (req as any).cspNonce = nonce;
  
  // Set CSP header with nonce
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`, // Only allow scripts with our nonce
    "style-src 'self' 'nonce-${nonce}'", // Only allow styles with our nonce
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  next();
}

// Get nonce for use in templates
export function getNonce(req: Request): string {
  return (req as any).cspNonce || '';
}

// Validate nonce in requests (for API endpoints that might need it)
export function validateNonce(req: Request, providedNonce: string): boolean {
  const expectedNonce = (req as any).cspNonce;
  return expectedNonce && expectedNonce === providedNonce;
}

// CSP violation reporting endpoint
export function handleCSPViolation(req: Request, res: Response): void {
  const violation = req.body;
  
  // Log CSP violations for security monitoring
  console.warn('🚨 CSP Violation:', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    violation: violation,
    timestamp: new Date().toISOString()
  });
  
  // Store violation for security analysis
  // This could be stored in database for analysis
  
  res.status(204).end();
}