import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to require PEG or ADMIN role
 */
export const requirePegAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  const allowedRoles = ['PEG', 'ADMIN'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({
      error: 'Forbidden',
      message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
    });
    return;
  }

  next();
};
