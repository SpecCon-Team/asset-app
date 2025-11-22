import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

interface CacheStore {
  [key: string]: {
    data: any;
    timestamp: number;
    userId?: string;
  };
}

const cache: CacheStore = {};
const DEFAULT_TTL = 60 * 1000; // 1 minute default

// Clean up old cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(cache).forEach(key => {
    if (now - cache[key].timestamp > 5 * 60 * 1000) {
      delete cache[key];
    }
  });
}, 5 * 60 * 1000);

export function cacheMiddleware(ttl: number = DEFAULT_TTL) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL, query params, and user ID
    const cacheKey = `${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    const cached = cache[cacheKey];

    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[CACHE HIT] ${req.originalUrl}`);
      return res.json(cached.data);
    }

    // Store the original json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = function (data: any) {
      // Don't cache error responses (those with statusCode >= 400 or error property)
      if (res.statusCode < 400 && !data.error) {
        cache[cacheKey] = {
          data,
          timestamp: Date.now(),
          userId: req.user?.id,
        };
        console.log(`[CACHE SET] ${req.originalUrl}`);
      } else {
        console.log(`[CACHE SKIP - ERROR] ${req.originalUrl}`);
      }
      return originalJson(data);
    };

    next();
  };
}

// Function to invalidate cache for specific patterns
export function invalidateCache(pattern?: string) {
  if (!pattern) {
    // Clear all cache
    Object.keys(cache).forEach(key => delete cache[key]);
    console.log('[CACHE] Cleared all cache');
    return;
  }

  // Clear cache entries matching pattern
  Object.keys(cache).forEach(key => {
    if (key.includes(pattern)) {
      delete cache[key];
    }
  });
  console.log(`[CACHE] Cleared cache for pattern: ${pattern}`);
}

// Middleware to invalidate cache on mutations
export function invalidateCacheMiddleware(patterns: string[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    patterns.forEach(pattern => invalidateCache(pattern));
    next();
  };
}
