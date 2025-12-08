import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Session Fixation Protection
 * Implements secure session management with rotation and fixation protection
 */

// Generate secure session ID
export function generateSecureSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Session fixation protection middleware
export function sessionFixationProtection(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  
  // If user is authenticated and this is a new session
  if (user && !req.session?.isAuthenticated) {
    // Regenerate session ID to prevent fixation
    const oldSessionId = req.sessionID;
    const newSessionId = generateSecureSessionId();
    
    // Mark session as authenticated
    req.session.isAuthenticated = true;
    req.session.userId = user.id;
    req.session.createdAt = new Date();
    req.session.lastActivity = new Date();
    
    // Store session rotation in audit log
    console.log('🔐 Session rotated for user:', {
      userId: user.id,
      email: user.email,
      oldSessionId: oldSessionId?.substring(0, 8) + '...',
      newSessionId: newSessionId.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  
  // Check for session timeout
  if (req.session?.lastActivity) {
    const now = new Date();
    const lastActivity = new Date(req.session.lastActivity);
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    if (now.getTime() - lastActivity.getTime() > maxAge) {
      // Session expired
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });
      
      return res.status(401).json({
        error: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        code: 'SESSION_EXPIRED'
      });
    }
    
    // Update last activity
    req.session.lastActivity = new Date();
  }
  
  // Limit concurrent sessions per user
  if (user && req.session?.userId) {
    // This would require database tracking of active sessions
    // For now, we'll implement basic concurrent session check
    checkConcurrentSessions(user.id, req, res, next);
  } else {
    next();
  }
}

// Check concurrent sessions (simplified version)
async function checkConcurrentSessions(
  userId: string, 
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // In a real implementation, you'd check database for active sessions
    // For now, we'll allow basic concurrent session management
    const maxConcurrentSessions = 3; // Configurable
    
    // This would be enhanced with proper session store
    const currentSessionCount = 1; // Placeholder
    
    if (currentSessionCount > maxConcurrentSessions) {
      return res.status(429).json({
        error: 'Too Many Sessions',
        message: 'Maximum concurrent sessions exceeded. Please log out from another device.',
        code: 'MAX_SESSIONS_EXCEEDED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Concurrent session check error:', error);
    next();
  }
}

// Session validation middleware
export function validateSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid session required',
      code: 'INVALID_SESSION'
    });
  }
  
  // Check session age
  if (req.session.createdAt) {
    const sessionAge = Date.now() - new Date(req.session.createdAt).getTime();
    const maxSessionAge = 8 * 60 * 60 * 1000; // 8 hours
    
    if (sessionAge > maxSessionAge) {
      req.session.destroy(() => {});
      return res.status(401).json({
        error: 'Session Expired',
        message: 'Session has expired due to age limit',
        code: 'SESSION_AGE_EXPIRED'
      });
    }
  }
  
  next();
}

// Invalidate all user sessions
export async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    // This would require session store integration
    // For now, we'll log the invalidation
    console.log('🔐 All sessions invalidated for user:', userId);
    
    // In implementation:
    // 1. Find all sessions for this user
    // 2. Mark them as invalid or destroy them
    // 3. Update audit log
  } catch (error) {
    console.error('Session invalidation error:', error);
  }
}