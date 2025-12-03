import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to require PEG_ADMIN or ADMIN role
 * PEG Admins have special permissions to manage PEG clients
 */
export const requirePegAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const allowedRoles = ['PEG_ADMIN', 'ADMIN'];
  
  if (allowedRoles.includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({ 
    error: 'PEG Admin access required',
    message: 'This endpoint requires PEG Admin or Admin role'
  });
};
