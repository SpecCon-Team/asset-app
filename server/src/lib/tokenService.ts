import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * Token Service
 * Handles JWT access tokens and refresh tokens with security best practices
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string; // User ID
  role: string;
  email: string;
  sessionId?: string;
}

const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Long-lived refresh token
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured');
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'asset-app',
    audience: 'asset-app-client'
  });
}

/**
 * Generate refresh token (long-lived, stored in database)
 */
export async function generateRefreshToken(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  // Generate cryptographically secure random token
  const token = crypto.randomBytes(40).toString('hex');

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Store in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    }
  });

  return token;
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  userId: string,
  role: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<TokenPair> {
  const payload: TokenPayload = {
    sub: userId,
    role,
    email
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(userId, ipAddress, userAgent);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'asset-app',
    audience: 'asset-app-client'
  }) as TokenPayload;
}

/**
 * Validate refresh token and return user info
 */
export async function validateRefreshToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Find token in database
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!refreshToken) {
      return { valid: false, error: 'Invalid refresh token' };
    }

    // Check if revoked
    if (refreshToken.isRevoked) {
      return { valid: false, error: 'Token has been revoked' };
    }

    // Check if expired
    if (refreshToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
      return { valid: false, error: 'Token has expired' };
    }

    // Check if user still exists and is verified
    if (!refreshToken.user || !refreshToken.user.emailVerified) {
      return { valid: false, error: 'User not found or not verified' };
    }

    return { valid: true, userId: refreshToken.userId };
  } catch (error) {
    console.error('Error validating refresh token:', error);
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: {
      isRevoked: true,
      revokedAt: new Date()
    }
  });
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      isRevoked: false
    },
    data: {
      isRevoked: true,
      revokedAt: new Date()
    }
  });

  return result.count;
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });

  return result.count;
}

/**
 * Get active sessions for user
 */
export async function getUserActiveSessions(userId: string) {
  return await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Rotate refresh token (issue new one, revoke old)
 */
export async function rotateRefreshToken(
  oldToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; newToken?: string; error?: string }> {
  const validation = await validateRefreshToken(oldToken);

  if (!validation.valid || !validation.userId) {
    return { success: false, error: validation.error };
  }

  // Revoke old token
  await revokeRefreshToken(oldToken);

  // Generate new token
  const newToken = await generateRefreshToken(validation.userId, ipAddress, userAgent);

  return { success: true, newToken };
}

// Run cleanup every hour
setInterval(async () => {
  try {
    const deleted = await cleanupExpiredTokens();
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired refresh tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}, 60 * 60 * 1000); // 1 hour
