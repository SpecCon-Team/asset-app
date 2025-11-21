import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request } from 'express';

/**
 * Enhanced Rate Limiting Module
 * Implements sophisticated rate limiting strategies
 */

/**
 * Get user identifier for rate limiting
 * Only returns user ID if authenticated, otherwise returns undefined
 * to let express-rate-limit handle IP addressing (including IPv6)
 */
function getUserKey(req: Request): string | undefined {
  const user = (req as any).user;
  if (user?.id) {
    return `user:${user.id}`;
  }
  // Return undefined to use default IP-based limiting
  return undefined;
}

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserKey(req),
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for ${getUserKey(req)} on ${req.path}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

/**
 * API rate limiter for general endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserKey(req),
  skip: (req) => {
    // Skip rate limiting for webhook endpoints
    return req.path.includes('/webhook');
  }
});

/**
 * Strict rate limiter for sensitive operations
 */
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 50 : 10,
  message: 'Too many sensitive operations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserKey(req)
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email for password reset if provided, otherwise undefined for IP-based limiting
    return req.body.email ? `reset:${req.body.email}` : undefined;
  }
});

/**
 * Rate limiter for OTP verification
 */
export const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many OTP verification attempts. Please request a new code.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email for OTP verification if provided, otherwise undefined for IP-based limiting
    return req.body.email ? `otp:${req.body.email}` : undefined;
  }
});

/**
 * Rate limiter for data exports (GDPR, reports, etc.)
 */
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many export requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserKey(req)
});

/**
 * Progressive delay rate limiter
 * Adds increasing delays for repeated requests
 */
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const PROGRESSIVE_WINDOW = 60 * 1000; // 1 minute

export function progressiveDelayMiddleware(req: Request, res: any, next: any) {
  // Skip in development mode to avoid delays during development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const key = getUserKey(req);
  const now = Date.now();

  let entry = requestCounts.get(key);

  // Reset counter if window expired
  if (!entry || now - entry.lastReset > PROGRESSIVE_WINDOW) {
    entry = { count: 0, lastReset: now };
  }

  entry.count++;
  requestCounts.set(key, entry);

  // Calculate delay: 0ms for first 30, then exponential (more lenient)
  let delay = 0;
  if (entry.count > 30) {
    delay = Math.min(Math.pow(2, entry.count - 30) * 100, 2000); // Max 2 seconds
  }

  if (delay > 0) {
    console.log(`Progressive delay: ${delay}ms for ${key}`);
    setTimeout(next, delay);
  } else {
    next();
  }
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now - entry.lastReset > PROGRESSIVE_WINDOW * 2) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Per-endpoint rate limit configurations
 */
export const endpointRateLimits: Record<string, RateLimitRequestHandler> = {
  '/api/auth/login': authRateLimiter,
  '/api/auth/register': authRateLimiter,
  '/api/auth/verify-2fa-login': authRateLimiter,
  '/api/auth/verify-otp': otpVerificationLimiter,
  '/api/auth/forgot-password': passwordResetLimiter,
  '/api/users/change-password': sensitiveOperationLimiter,
  '/api/2fa/setup': sensitiveOperationLimiter,
  '/api/2fa/disable': sensitiveOperationLimiter,
  '/api/gdpr/export': exportRateLimiter,
  '/api/gdpr/delete': sensitiveOperationLimiter
};

/**
 * Dynamic rate limiter that applies different limits based on endpoint
 */
export function dynamicRateLimiter(req: Request, res: any, next: any) {
  const limiter = endpointRateLimits[req.path];

  if (limiter) {
    return limiter(req, res, next);
  }

  // Default API rate limiter
  return apiRateLimiter(req, res, next);
}
