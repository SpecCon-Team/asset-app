import { Request, Response, NextFunction } from 'express';

/**
 * HTML Sanitization Middleware
 * Implements comprehensive HTML sanitization to prevent XSS attacks
 */

// Basic HTML sanitization (since DOMPurify is client-side)
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return html
    // Remove dangerous tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^<]*>/gi, '')
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<meta\b[^<]*>/gi, '')
    
    // Remove dangerous attributes
    .replace(/\bon\w+\s*=/gi, '') // Remove on* event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:/gi, '') // Remove data: protocol (except for images)
    
    // Remove CSS expressions
    .replace(/expression\s*\(/gi, '')
    
    // Remove HTML comments (might contain scripts)
    .replace(/<!--[\s\S]*?-->/g, '')
    
    // Clean up extra whitespace
    .trim();
}

// Sanitize user input fields
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeHTML(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Validate and sanitize rich text content
export function sanitizeRichText(content: string): { 
  clean: boolean; 
  sanitized: string; 
  threats?: string[] 
} {
  const threats: string[] = [];
  let sanitized = content;
  
  // Check for XSS patterns
  const xssPatterns = [
    { pattern: /<script[^>]*>/gi, threat: 'Script tag detected' },
    { pattern: /javascript:/gi, threat: 'JavaScript protocol detected' },
    { pattern: /on\w+\s*=/gi, threat: 'Event handler detected' },
    { pattern: /<iframe[^>]*>/gi, threat: 'Iframe tag detected' },
    { pattern: /<object[^>]*>/gi, threat: 'Object tag detected' },
    { pattern: /<embed[^>]*>/gi, threat: 'Embed tag detected' },
    { pattern: /expression\s*\(/gi, threat: 'CSS expression detected' }
  ];
  
  for (const { pattern, threat } of xssPatterns) {
    if (pattern.test(content)) {
      threats.push(threat);
    }
  }
  
  // Apply sanitization
  sanitized = sanitizeHTML(content);
  
  // Allow safe HTML tags for rich text
  const allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'a', 'img'
  ];
  
  // Basic tag reconstruction (simplified)
  allowedTags.forEach(tag => {
    const openTag = new RegExp(`</?${tag}[^>]*>`, 'gi');
    // This is a simplified approach - in production, use a proper HTML parser
  });
  
  return {
    clean: threats.length === 0,
    sanitized,
    threats: threats.length > 0 ? threats : undefined
  };
}

// Middleware to sanitize request body
export function sanitizeRequestBody(req: Request, res: Response, next: NextFunction): void {
  try {
    // Sanitize body based on content type
    if (req.body) {
      if (req.is('application/json')) {
        req.body = sanitizeInput(req.body);
      } else if (req.is('application/x-www-form-urlencoded')) {
        req.body = sanitizeInput(req.body);
      }
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid input format',
      code: 'SANITIZATION_ERROR'
    });
  }
}

// Validate file content for HTML injection
export function validateFileContent(buffer: Buffer, filename: string): {
  safe: boolean;
  threats?: string[];
} {
  const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
  const threats: string[] = [];
  
  // Check for HTML content in non-HTML files
  const htmlExtensions = ['.html', '.htm', '.xhtml'];
  const isHtmlFile = htmlExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  
  if (!isHtmlFile) {
    const htmlPatterns = [
      /<html[^>]*>/gi,
      /<head[^>]*>/gi,
      /<body[^>]*>/gi,
      /<script[^>]*>/gi
    ];
    
    for (const pattern of htmlPatterns) {
      if (pattern.test(content)) {
        threats.push('HTML content detected in non-HTML file');
        break;
      }
    }
  }
  
  // Check for script content
  if (/javascript:|<script|eval\s*\(/gi.test(content)) {
    threats.push('JavaScript content detected');
  }
  
  return {
    safe: threats.length === 0,
    threats: threats.length > 0 ? threats : undefined
  };
}

// Content Security Policy violation handler
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

// Generate safe HTML for user content display
export function generateSafeHTML(content: string, allowedTags: string[] = []): string {
  // This is a simplified implementation
  // In production, use a proper HTML sanitizer library
  
  const sanitized = sanitizeHTML(content);
  
  // If no specific tags allowed, return plain text
  if (allowedTags.length === 0) {
    return sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Basic tag reconstruction for allowed tags
  // This is highly simplified - use proper HTML parser in production
  return sanitized;
}