import crypto from 'crypto';
import { prisma } from './prisma';
import { Request } from 'express';

/**
 * Session Management Module
 * Tracks user sessions across devices with fingerprinting
 */

export interface SessionInfo {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  fingerprint?: string;
}

/**
 * Parse user agent to extract device and browser info
 */
function parseUserAgent(userAgent: string): { device: string; browser: string } {
  const ua = userAgent.toLowerCase();

  // Detect device
  let device = 'Desktop';
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
    device = 'Mobile';
  } else if (/tablet|ipad/.test(ua)) {
    device = 'Tablet';
  }

  // Detect browser
  let browser = 'Unknown';
  if (/edg/.test(ua)) {
    browser = 'Edge';
  } else if (/chrome/.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox/.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/.test(ua)) {
    browser = 'Safari';
  } else if (/opera|opr/.test(ua)) {
    browser = 'Opera';
  }

  return { device, browser };
}

/**
 * Generate browser fingerprint from request
 */
export function generateFingerprint(req: Request): string {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || ''
  ];

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
}

/**
 * Create new user session
 */
export async function createSession(sessionInfo: SessionInfo): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const { device, browser } = parseUserAgent(sessionInfo.userAgent || '');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.userSession.create({
    data: {
      userId: sessionInfo.userId,
      sessionToken,
      ipAddress: sessionInfo.ipAddress || null,
      userAgent: sessionInfo.userAgent || null,
      device,
      browser,
      fingerprint: sessionInfo.fingerprint || null,
      expiresAt
    }
  });

  return sessionToken;
}

/**
 * Validate session
 */
export async function validateSession(sessionToken: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    if (!session.isActive) {
      return { valid: false, error: 'Session has been terminated' };
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.userSession.delete({ where: { id: session.id } });
      return { valid: false, error: 'Session has expired' };
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });

    return { valid: true, userId: session.userId };
  } catch (error) {
    console.error('Error validating session:', error);
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return await prisma.userSession.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      ipAddress: true,
      device: true,
      browser: true,
      location: true,
      lastActivityAt: true,
      createdAt: true
    },
    orderBy: {
      lastActivityAt: 'desc'
    }
  });
}

/**
 * Terminate a specific session
 */
export async function terminateSession(sessionId: string): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false }
  });
}

/**
 * Terminate all sessions for a user except current
 */
export async function terminateOtherSessions(
  userId: string,
  currentSessionToken: string
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      sessionToken: {
        not: currentSessionToken
      },
      isActive: true
    },
    data: {
      isActive: false
    }
  });

  return result.count;
}

/**
 * Terminate all sessions for a user
 */
export async function terminateAllSessions(userId: string): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      isActive: true
    },
    data: {
      isActive: false
    }
  });

  return result.count;
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return result.count;
}

/**
 * Check for suspicious session activity
 */
export async function detectSuspiciousActivity(
  userId: string,
  newIpAddress: string,
  newFingerprint: string
): Promise<{ suspicious: boolean; reason?: string }> {
  // Get recent sessions
  const recentSessions = await prisma.userSession.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (recentSessions.length === 0) {
    return { suspicious: false };
  }

  // Check for rapid location changes
  const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress).filter(Boolean));
  if (uniqueIPs.size > 5) {
    return {
      suspicious: true,
      reason: 'Multiple different IP addresses in short time'
    };
  }

  // Check for fingerprint changes
  const uniqueFingerprints = new Set(
    recentSessions.map(s => s.fingerprint).filter(Boolean)
  );
  if (uniqueFingerprints.size > 3) {
    return {
      suspicious: true,
      reason: 'Multiple different devices/browsers'
    };
  }

  return { suspicious: false };
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: {
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
  }
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType,
        severity,
        userId: details.userId || null,
        userEmail: details.userEmail || null,
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null,
        details: JSON.stringify(details)
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Run cleanup every 6 hours
setInterval(async () => {
  try {
    const deleted = await cleanupExpiredSessions();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired sessions`);
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}, 6 * 60 * 60 * 1000);
