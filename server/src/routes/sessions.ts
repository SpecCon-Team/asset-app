import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserSessions,
  terminateSession,
  terminateOtherSessions,
  terminateAllSessions,
  logSecurityEvent
} from '../lib/sessionManagement';
import { revokeRefreshToken, getUserActiveSessions } from '../lib/tokenService';

const router = Router();

/**
 * GET /api/sessions - Get user's active sessions
 * Returns all active sessions across devices
 */
router.get('/', authenticate, async (req: Request, res) => {
  try {
    const sessions = await getUserSessions(req.user!.id);

    // Also get refresh token sessions for complete picture
    const refreshTokenSessions = await getUserActiveSessions(req.user!.id);

    res.json({
      sessions,
      activeTokens: refreshTokenSessions.length,
      totalActiveSessions: sessions.length
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

/**
 * DELETE /api/sessions/:id - Terminate specific session
 * Allows user to logout from a specific device
 */
router.delete('/:id', authenticate, async (req: Request, res) => {
  try {
    const { id } = req.params;

    // Verify session belongs to user
    const sessions = await getUserSessions(req.user!.id);
    const sessionExists = sessions.some(s => s.id === id);

    if (!sessionExists) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await terminateSession(id);

    // Log security event
    await logSecurityEvent(
      'session_terminated',
      'medium',
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: `User manually terminated session ${id}`
      }
    );

    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    console.error('Failed to terminate session:', error);
    res.status(500).json({ message: 'Failed to terminate session' });
  }
});

/**
 * POST /api/sessions/terminate-others - Logout other devices
 * Keeps current session active, terminates all others
 */
router.post('/terminate-others', authenticate, async (req: Request, res) => {
  try {
    const currentSessionToken = req.headers['x-session-token'] as string;

    if (!currentSessionToken) {
      return res.status(400).json({
        message: 'Session token required. Include X-Session-Token header.'
      });
    }

    const count = await terminateOtherSessions(req.user!.id, currentSessionToken);

    // Log security event
    await logSecurityEvent(
      'sessions_terminated_bulk',
      'high',
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: `User terminated ${count} other session(s)`
      }
    );

    res.json({
      message: `Successfully terminated ${count} other session(s)`,
      terminatedCount: count
    });
  } catch (error) {
    console.error('Failed to terminate other sessions:', error);
    res.status(500).json({ message: 'Failed to terminate other sessions' });
  }
});

/**
 * POST /api/sessions/terminate-all - Logout all devices
 * Terminates ALL sessions including current one
 */
router.post('/terminate-all', authenticate, async (req: Request, res) => {
  try {
    // Terminate all sessions
    const sessionCount = await terminateAllSessions(req.user!.id);

    // Also revoke all refresh tokens
    const { revokeAllUserTokens } = await import('../lib/tokenService');
    const tokenCount = await revokeAllUserTokens(req.user!.id);

    // Log security event
    await logSecurityEvent(
      'all_sessions_terminated',
      'high',
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: `User terminated all sessions (${sessionCount} sessions, ${tokenCount} tokens)`
      }
    );

    res.json({
      message: 'All sessions and tokens revoked. Please login again.',
      sessionsTerminated: sessionCount,
      tokensRevoked: tokenCount
    });
  } catch (error) {
    console.error('Failed to terminate all sessions:', error);
    res.status(500).json({ message: 'Failed to terminate all sessions' });
  }
});

/**
 * GET /api/sessions/active-tokens - Get active refresh tokens
 * Shows all refresh tokens (login sessions) for the user
 */
router.get('/active-tokens', authenticate, async (req: Request, res) => {
  try {
    const tokens = await getUserActiveSessions(req.user!.id);

    res.json({
      tokens,
      count: tokens.length
    });
  } catch (error) {
    console.error('Failed to fetch active tokens:', error);
    res.status(500).json({ message: 'Failed to fetch active tokens' });
  }
});

/**
 * DELETE /api/sessions/token/:id - Revoke specific refresh token
 * Allows revoking a specific refresh token (login session)
 */
router.delete('/token/:id', authenticate, async (req: Request, res) => {
  try {
    const { id } = req.params;

    // Verify token belongs to user
    const tokens = await getUserActiveSessions(req.user!.id);
    const token = tokens.find(t => t.id === id);

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Revoke by updating the database record
    const { prisma } = await import('../lib/prisma');
    await prisma.refreshToken.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    await logSecurityEvent(
      'refresh_token_revoked',
      'medium',
      {
        userId: req.user!.id,
        userEmail: req.user!.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: `User revoked refresh token ${id}`
      }
    );

    res.json({ message: 'Token revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke token:', error);
    res.status(500).json({ message: 'Failed to revoke token' });
  }
});

export default router;
