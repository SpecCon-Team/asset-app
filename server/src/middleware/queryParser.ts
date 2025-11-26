import { Request, Response, NextFunction } from 'express';

export function parseQuery(req: Request, res: Response, next: NextFunction) {
  for (const key in req.query) {
    const value = req.query[key];
    if (Array.isArray(value)) {
      req.query[key] = value[0];
    }
  }
  next();
}
