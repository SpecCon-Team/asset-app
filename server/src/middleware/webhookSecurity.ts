import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Webhook Security Middleware
 * Implements signature verification for webhook security
 */

// Verify webhook signature using HMAC-SHA256
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// WhatsApp webhook signature verification
export function verifyWhatsAppWebhook(req: Request, res: Response, next: NextFunction): void {
  const signature = req.get('X-Hub-Signature-256');
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Allow bypassing signature verification in development for testing
  if (process.env.NODE_ENV === 'development' && !signature) {
    console.log('⚠️  Development mode: Bypassing WhatsApp webhook signature verification');
    return next();
  }

  if (!signature) {
    console.warn('🚨 WhatsApp webhook missing signature');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing webhook signature',
      code: 'MISSING_SIGNATURE'
    });
  }
  
  // Extract signature from "sha256=..." format
  const signatureHash = signature.replace('sha256=', '');
  
  // Get raw body for signature verification
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(rawBody, signatureHash, verifyToken)) {
    console.warn('🚨 WhatsApp webhook invalid signature:', {
      signature: signature.substring(0, 20) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid webhook signature',
      code: 'INVALID_SIGNATURE'
    });
  }
  
  console.log('✅ WhatsApp webhook signature verified');
  next();
}

// Generic webhook verification for other services
export function verifyGenericWebhook(secretHeader: string, secretEnv: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.get(secretHeader);
    const secret = process.env[secretEnv];
    
    if (!signature || !secret) {
      console.warn(`🚨 Webhook missing signature or secret: ${secretHeader}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing webhook signature or secret',
        code: 'MISSING_WEBHOOK_SECRET'
      });
    }
    
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      console.warn(`🚨 Invalid webhook signature for ${secretHeader}:`, {
        signature: signature.substring(0, 20) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature',
        code: 'INVALID_WEBHOOK_SIGNATURE'
      });
    }
    
    console.log(`✅ Webhook signature verified for ${secretHeader}`);
    next();
  };
}

// Rate limiting specifically for webhooks
export function webhookRateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < now) {
        requests.delete(ip);
      }
    }
    
    const current = requests.get(key);
    
    if (!current || current.resetTime < now) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (current.count >= maxRequests) {
      console.warn(`🚨 Webhook rate limit exceeded for ${key}:`, {
        count: current.count,
        resetTime: new Date(current.resetTime)
      });
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Webhook rate limit exceeded',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }
    
    current.count++;
    next();
  };
}

// Webhook logging for security monitoring
export function logWebhookEvent(req: Request, source: string, eventType: string): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    source,
    eventType,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    signature: req.get('X-Hub-Signature-256') || req.get('X-Webhook-Signature'),
    bodySize: JSON.stringify(req.body).length
  };
  
  console.log(`📩 Webhook Event [${source}]:`, logEntry);
  
  // Store in database for security analysis
  // This would be enhanced with proper database logging
}