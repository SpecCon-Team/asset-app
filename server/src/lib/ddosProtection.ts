import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Advanced DDoS Protection and Rate Limiting
 * Implements sophisticated DDoS detection and mitigation
 */

interface DDoSMetrics {
  requestCount: number;
  suspiciousCount: number;
  blockedCount: number;
  lastReset: number;
  riskScore: number;
}

interface IPReputation {
  score: number;
  lastSeen: number;
  violations: number;
  blocked: boolean;
}

// In-memory stores for DDoS detection
const ipMetrics = new Map<string, DDoSMetrics>();
const ipReputation = new Map<string, IPReputation>();
const globalMetrics = {
  totalRequests: 0,
  blockedRequests: 0,
  suspiciousPatterns: 0,
  lastCleanup: Date.now()
};

// DDoS detection thresholds
const DDOS_THRESHOLDS = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  suspiciousThreshold: 10,
  maxConcurrentConnections: 50,
  riskScoreThreshold: 75
};

// Calculate IP reputation score
function calculateIPReputation(ip: string, metrics: DDoSMetrics): IPReputation {
  const existing = ipReputation.get(ip) || {
    score: 50, // Neutral score
    lastSeen: Date.now(),
    violations: 0,
    blocked: false
  };
  
  let score = existing.score;
  
  // Factor in request frequency
  if (metrics.requestCount > DDOS_THRESHOLDS.requestsPerMinute) {
    score -= 20;
  }
  
  // Factor in suspicious activity
  if (metrics.suspiciousCount > DDOS_THRESHOLDS.suspiciousThreshold) {
    score -= 30;
  }
  
  // Factor in blocked requests
  if (metrics.blockedCount > 0) {
    score -= 40;
  }
  
  // Decay score over time (recovery)
  const timeSinceLastSeen = Date.now() - existing.lastSeen;
  if (timeSinceLastSeen > 24 * 60 * 60 * 1000) { // 24 hours
    score += 10; // Gradual recovery
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    lastSeen: Date.now(),
    violations: existing.violations + (metrics.blockedCount > 0 ? 1 : 0),
    blocked: score < 20
  };
}

// Detect attack patterns
function detectAttackPattern(ip: string, metrics: DDoSMetrics): {
  isAttack: boolean;
  attackType: string;
  confidence: number;
} {
  const now = Date.now();
  const requestsPerMinute = metrics.requestCount;
  const suspiciousRatio = metrics.suspiciousCount / Math.max(1, metrics.requestCount);
  
  // HTTP Flood Detection
  if (requestsPerMinute > DDOS_THRESHOLDS.requestsPerMinute) {
    return {
      isAttack: true,
      attackType: 'HTTP_FLOOD',
      confidence: Math.min(100, (requestsPerMinute / DDOS_THRESHOLDS.requestsPerMinute) * 100)
    };
  }
  
  // Brute Force Detection
  if (suspiciousRatio > 0.5 && metrics.requestCount > 20) {
    return {
      isAttack: true,
      attackType: 'BRUTE_FORCE',
      confidence: Math.min(100, suspiciousRatio * 200)
    };
  }
  
  // Slowloris Detection (many slow connections)
  if (metrics.requestCount > DDOS_THRESHOLDS.maxConcurrentConnections) {
    return {
      isAttack: true,
      attackType: 'SLOWLORIS',
      confidence: 75
    };
  }
  
  return {
    isAttack: false,
    attackType: 'NONE',
    confidence: 0
  };
}

// Advanced DDoS protection middleware
export function ddosProtection(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Initialize or update IP metrics
  let metrics = ipMetrics.get(ip);
  if (!metrics) {
    metrics = {
      requestCount: 0,
      suspiciousCount: 0,
      blockedCount: 0,
      lastReset: now,
      riskScore: 0
    };
  }
  
  // Reset counters if window expired
  if (now - metrics.lastReset > 60 * 1000) { // 1 minute window
    metrics.requestCount = 0;
    metrics.suspiciousCount = 0;
    metrics.lastReset = now;
  }
  
  metrics.requestCount++;
  globalMetrics.totalRequests++;
  
  // Detect suspicious patterns
  const suspiciousPatterns = [
    req.url?.includes('..') || false, // Path traversal
    req.url?.includes('<script') || false, // XSS attempt
    req.url?.includes('SELECT') || false, // SQL injection
    req.url?.includes('UNION') || false, // SQL injection
    Object.keys(req.body || {}).length > 50, // Large payload
    (req.get('User-Agent') || '').length > 500 // Suspicious user agent
  ];
  
  const suspiciousCount = suspiciousPatterns.filter(Boolean).length;
  if (suspiciousCount > 0) {
    metrics.suspiciousCount += suspiciousCount;
    globalMetrics.suspiciousPatterns++;
  }
  
  // Update IP reputation
  const reputation = calculateIPReputation(ip, metrics);
  ipReputation.set(ip, reputation);
  
  // Detect attack patterns
  const attackDetection = detectAttackPattern(ip, metrics);
  
  // Calculate risk score
  metrics.riskScore = (
    (metrics.requestCount / DDOS_THRESHOLDS.requestsPerMinute) * 30 +
    (metrics.suspiciousCount / DDOS_THRESHOLDS.suspiciousThreshold) * 40 +
    (reputation.score < 30 ? 50 : 0) +
    (attackDetection.confidence * 0.3)
  );
  
  // Store updated metrics
  ipMetrics.set(ip, metrics);
  
  // Log suspicious activity
  if (suspiciousCount > 0 || attackDetection.isAttack) {
    console.warn('🚨 Suspicious activity detected:', {
      ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      suspiciousPatterns,
      attackType: attackDetection.attackType,
      confidence: attackDetection.confidence,
      riskScore: metrics.riskScore,
      reputation: reputation.score
    });
    
    // Store security event
    prisma.securityEvent.create({
      data: {
        eventType: attackDetection.isAttack ? 'ddos_attack' : 'suspicious_activity',
        severity: metrics.riskScore > 75 ? 'high' : 'medium',
        ipAddress: ip,
        userAgent: req.get('User-Agent'),
        details: JSON.stringify({
          attackType: attackDetection.attackType,
          confidence: attackDetection.confidence,
          suspiciousPatterns,
          riskScore: metrics.riskScore
        }),
        resolved: false
      }
    }).catch(error => {
      console.error('Failed to log security event:', error);
    });
  }
  
  // Block if risk score too high or reputation too low
  if (metrics.riskScore > DDOS_THRESHOLDS.riskScoreThreshold || reputation.score < 20) {
    metrics.blockedCount++;
    globalMetrics.blockedRequests++;
    
    console.warn('🚫 Request blocked by DDoS protection:', {
      ip,
      riskScore: metrics.riskScore,
      reputation: reputation.score,
      attackType: attackDetection.attackType,
      reason: metrics.riskScore > DDOS_THRESHOLDS.riskScoreThreshold ? 'High risk score' : 'Low IP reputation'
    });
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Request blocked due to suspicious activity',
      code: 'DDOS_PROTECTION',
      retryAfter: 60
    });
  }
  
  // Add security headers
  res.setHeader('X-DDoS-Protection', 'active');
  res.setHeader('X-Risk-Score', metrics.riskScore.toString());
  res.setHeader('X-IP-Reputation', reputation.score.toString());
  
  next();
}

// Cleanup old metrics
function cleanupMetrics(): void {
  const now = Date.now();
  
  // Cleanup every 5 minutes
  if (now - globalMetrics.lastCleanup < 5 * 60 * 1000) {
    return;
  }
  
  const cutoffTime = now - (60 * 60 * 1000); // 1 hour ago
  
  for (const [ip, metrics] of ipMetrics.entries()) {
    if (metrics.lastReset < cutoffTime) {
      ipMetrics.delete(ip);
    }
  }
  
  for (const [ip, reputation] of ipReputation.entries()) {
    if (reputation.lastSeen < cutoffTime) {
      ipReputation.delete(ip);
    }
  }
  
  globalMetrics.lastCleanup = now;
  console.log('🧹 DDoS protection metrics cleaned up');
}

// Get DDoS protection statistics
export function getDDoSStats(): {
  totalRequests: number;
  blockedRequests: number;
  suspiciousPatterns: number;
  activeIPs: number;
  blockedIPs: number;
  averageRiskScore: number;
} {
  const activeIPs = ipMetrics.size;
  const blockedIPs = Array.from(ipReputation.values()).filter(rep => rep.blocked).length;
  
  let totalRiskScore = 0;
  for (const metrics of ipMetrics.values()) {
    totalRiskScore += metrics.riskScore;
  }
  
  const averageRiskScore = activeIPs > 0 ? totalRiskScore / activeIPs : 0;
  
  return {
    totalRequests: globalMetrics.totalRequests,
    blockedRequests: globalMetrics.blockedRequests,
    suspiciousPatterns: globalMetrics.suspiciousPatterns,
    activeIPs,
    blockedIPs,
    averageRiskScore
  };
}

// Manual IP blocking
export function blockIP(ip: string, duration: number = 3600000): void { // 1 hour default
  const reputation = ipReputation.get(ip) || {
    score: 50,
    lastSeen: Date.now(),
    violations: 0,
    blocked: false
  };
  
  reputation.score = 0; // Minimum score
  reputation.blocked = true;
  ipReputation.set(ip, reputation);
  
  console.log('🚫 IP manually blocked:', { ip, duration });
  
  // Auto-unblock after duration
  setTimeout(() => {
    const current = ipReputation.get(ip);
    if (current) {
      current.blocked = false;
      current.score = 25; // Low but not zero
      ipReputation.set(ip, current);
      console.log('✅ IP auto-unblocked:', { ip });
    }
  }, duration);
}

// Start cleanup interval
setInterval(cleanupMetrics, 5 * 60 * 1000); // Every 5 minutes

console.log('🛡️  Advanced DDoS protection initialized');