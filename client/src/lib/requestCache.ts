/**
 * Simple request deduplication and caching mechanism
 * Prevents multiple identical API calls from running simultaneously
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultTTL: number = 30000; // 30 seconds default cache

  /**
   * Get cached data or execute the request
   * Deduplicates simultaneous requests to the same endpoint
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check if we have fresh cached data
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Execute the request
    const promise = fetcher()
      .then((data) => {
        // Cache the result
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
        });

        // Remove from pending
        this.pendingRequests.delete(key);

        return data;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store as pending
    this.pendingRequests.set(key, promise);

    return promise;
  }

  /**
   * Invalidate cache for a specific key or pattern
   */
  invalidate(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
      this.pendingRequests.delete(keyOrPattern);
    } else {
      // Pattern matching
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (keyOrPattern.test(key)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
      });
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.defaultTTL) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }
}

// Export singleton instance
export const requestCache = new RequestCache();

// Run cleanup every minute
if (typeof window !== 'undefined') {
  setInterval(() => requestCache.cleanup(), 60000);
}

export default requestCache;
