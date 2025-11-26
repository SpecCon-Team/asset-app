import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
  body: Request['body'];
  params: Request['params'];
  query: Request['query'];
  originalUrl: Request['originalUrl'];
}

/**
 * Authentication middleware - Verifies JWT token
 * Adds user information to request object
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please provide a valid token.'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      res.status(500).json({
        error: 'Server Error',
        message: 'Authentication system is not properly configured'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      sub: string;
      role: string;
    };

    // Fetch user from database to ensure they still exist and haven't been deleted
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found. Token may be invalid.'
      });
      return;
    }

    // Check if email is verified
    if (!user.emailVerified) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Email not verified. Please verify your email to continue.'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired. Please login again.'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token. Please login again.'
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Role-based access control middleware
 * Checks if authenticated user has one of the required roles
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Resource ownership validation middleware
 * Checks if user owns the resource or is an admin
 */
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    // Admins can access everything
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (resourceUserId !== req.user.id) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is self or admin
 * Used for user profile operations
 */
export const requireSelfOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
    return;
  }

  const targetUserId = req.params.id || req.params.userId;

  // Allow if user is modifying their own data or is an admin
  if (req.user.id === targetUserId || req.user.role === 'ADMIN') {
    next();
    return;
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'You can only access your own profile'
  });
};
