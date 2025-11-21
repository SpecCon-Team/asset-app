import { prisma } from './prisma';
import { logSecurityEvent } from './sessionManagement';

/**
 * Security Monitoring & Alerting System
 * Real-time monitoring of security events with automated alerting
 */

export interface SecurityAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  details: any;
  timestamp: Date;
}

export interface MonitoringConfig {
  failedLoginThreshold: number;
  suspiciousActivityThreshold: number;
  alertEmail?: string;
  alertWebhook?: string;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  failedLoginThreshold: 5,
  suspiciousActivityThreshold: 10
};

// In-memory tracking for real-time monitoring
const recentEvents = new Map<string, number>();
const alerts: SecurityAlert[] = [];

/**
 * Monitor failed login attempts
 */
export async function monitorFailedLogins(
  email: string,
  ipAddress: string
): Promise<void> {
  const key = `failed_login:${email}:${ipAddress}`;
  const count = (recentEvents.get(key) || 0) + 1;
  recentEvents.set(key, count);

  if (count >= DEFAULT_CONFIG.failedLoginThreshold) {
    await createAlert({
      severity: 'high',
      type: 'BRUTE_FORCE_ATTEMPT',
      message: `Multiple failed login attempts detected for ${email} from ${ipAddress}`,
      details: {
        email,
        ipAddress,
        attemptCount: count
      },
      timestamp: new Date()
    });

    // Log security event
    await logSecurityEvent('brute_force_detected', 'high', {
      userEmail: email,
      ipAddress,
      description: `${count} failed login attempts detected`
    });
  }

  // Reset counter after 1 hour
  setTimeout(() => {
    recentEvents.delete(key);
  }, 60 * 60 * 1000);
}

/**
 * Monitor suspicious account activity
 */
export async function monitorSuspiciousActivity(
  userId: string,
  activityType: string,
  details: any
): Promise<void> {
  const key = `suspicious:${userId}:${activityType}`;
  const count = (recentEvents.get(key) || 0) + 1;
  recentEvents.set(key, count);

  if (count >= DEFAULT_CONFIG.suspiciousActivityThreshold) {
    await createAlert({
      severity: 'critical',
      type: 'SUSPICIOUS_ACTIVITY',
      message: `Suspicious activity detected for user ${userId}`,
      details: {
        userId,
        activityType,
        occurrences: count,
        details
      },
      timestamp: new Date()
    });

    // Log to database
    await logSecurityEvent('suspicious_activity', 'critical', {
      userId,
      description: `${count} suspicious ${activityType} detected`,
      details: JSON.stringify(details)
    });
  }
}

/**
 * Monitor data export requests (GDPR, reports)
 */
export async function monitorDataExport(
  userId: string,
  exportType: string,
  recordCount: number
): Promise<void> {
  // Large data exports are flagged
  if (recordCount > 1000) {
    await createAlert({
      severity: 'medium',
      type: 'LARGE_DATA_EXPORT',
      message: `Large data export by user ${userId}`,
      details: {
        userId,
        exportType,
        recordCount
      },
      timestamp: new Date()
    });
  }

  // Log all exports
  await logSecurityEvent('data_export', 'medium', {
    userId,
    description: `${exportType} export of ${recordCount} records`
  });
}

/**
 * Monitor privilege escalation attempts
 */
export async function monitorPrivilegeEscalation(
  userId: string,
  attemptedAction: string,
  requiredRole: string
): Promise<void> {
  await createAlert({
    severity: 'critical',
    type: 'PRIVILEGE_ESCALATION_ATTEMPT',
    message: `User ${userId} attempted unauthorized action`,
    details: {
      userId,
      attemptedAction,
      requiredRole
    },
    timestamp: new Date()
  });

  await logSecurityEvent('privilege_escalation_attempt', 'critical', {
    userId,
    description: `Attempted ${attemptedAction} without ${requiredRole} role`
  });
}

/**
 * Monitor unusual login patterns
 */
export async function monitorLoginPattern(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  // Get recent login history
  const recentLogins = await prisma.loginHistory.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Check for new location
  const knownIPs = new Set(recentLogins.map(l => l.ipAddress));
  if (!knownIPs.has(ipAddress) && recentLogins.length > 0) {
    await createAlert({
      severity: 'medium',
      type: 'NEW_LOCATION_LOGIN',
      message: `User ${userId} logged in from new location`,
      details: {
        userId,
        ipAddress,
        userAgent
      },
      timestamp: new Date()
    });
  }

  // Check for rapid location changes (impossible travel)
  if (recentLogins.length > 0) {
    const lastLogin = recentLogins[0];
    const timeDiff = Date.now() - lastLogin.createdAt.getTime();

    // If logged in from different IP within 1 hour
    if (lastLogin.ipAddress !== ipAddress && timeDiff < 60 * 60 * 1000) {
      await createAlert({
        severity: 'high',
        type: 'IMPOSSIBLE_TRAVEL',
        message: `Suspicious: User ${userId} logged in from different locations within 1 hour`,
        details: {
          userId,
          previousIP: lastLogin.ipAddress,
          currentIP: ipAddress,
          timeDiffMinutes: Math.round(timeDiff / 60000)
        },
        timestamp: new Date()
      });
    }
  }
}

/**
 * Create and store security alert
 */
async function createAlert(alert: SecurityAlert): Promise<void> {
  // Store in memory for quick access
  alerts.push(alert);

  // Keep only last 100 alerts in memory
  if (alerts.length > 100) {
    alerts.shift();
  }

  // Log to console with color coding
  const colors = {
    low: '\x1b[32m',      // Green
    medium: '\x1b[33m',   // Yellow
    high: '\x1b[31m',     // Red
    critical: '\x1b[35m'  // Magenta
  };

  console.log(
    `${colors[alert.severity]}[SECURITY ALERT - ${alert.severity.toUpperCase()}]\x1b[0m`,
    alert.message
  );

  // TODO: Send email/webhook notifications
  await sendAlertNotification(alert);
}

/**
 * Send alert notification via email or webhook
 */
async function sendAlertNotification(alert: SecurityAlert): Promise<void> {
  // Email notification (requires email service configuration)
  if (DEFAULT_CONFIG.alertEmail) {
    // TODO: Integrate with email service
    console.log(`📧 Alert email would be sent to: ${DEFAULT_CONFIG.alertEmail}`);
  }

  // Webhook notification (e.g., Slack, Discord, Teams)
  if (DEFAULT_CONFIG.alertWebhook) {
    try {
      // TODO: Implement webhook notification
      console.log(`🔔 Alert webhook would be sent to: ${DEFAULT_CONFIG.alertWebhook}`);
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }
}

/**
 * Get recent security alerts
 */
export function getRecentAlerts(limit: number = 20): SecurityAlert[] {
  return alerts.slice(-limit).reverse();
}

/**
 * Get security metrics for dashboard
 */
export async function getSecurityMetrics(): Promise<{
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  unresolvedAlerts: number;
}> {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalEvents, criticalEvents, failedLogins, unresolvedAlerts] = await Promise.all([
    prisma.securityEvent.count({
      where: { createdAt: { gte: last24h } }
    }),
    prisma.securityEvent.count({
      where: {
        createdAt: { gte: last24h },
        severity: 'critical'
      }
    }),
    prisma.loginHistory.count({
      where: {
        createdAt: { gte: last24h },
        success: false
      }
    }),
    prisma.securityEvent.count({
      where: {
        resolved: false,
        severity: { in: ['high', 'critical'] }
      }
    })
  ]);

  const suspiciousActivities = alerts.filter(a => a.type === 'SUSPICIOUS_ACTIVITY').length;

  return {
    totalEvents,
    criticalEvents,
    failedLogins,
    suspiciousActivities,
    unresolvedAlerts
  };
}

/**
 * Analyze security trends
 */
export async function analyzeSecurityTrends(): Promise<{
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}> {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [recentEvents, olderEvents] = await Promise.all([
    prisma.securityEvent.count({
      where: { createdAt: { gte: last7Days } }
    }),
    prisma.securityEvent.count({
      where: {
        createdAt: { gte: last14Days, lt: last7Days }
      }
    })
  ]);

  const recommendations: string[] = [];
  let trend: 'improving' | 'stable' | 'declining' = 'stable';

  if (recentEvents < olderEvents * 0.8) {
    trend = 'improving';
  } else if (recentEvents > olderEvents * 1.2) {
    trend = 'declining';
    recommendations.push('Increase monitoring and review recent security events');
    recommendations.push('Consider implementing additional access controls');
  }

  if (recentEvents > 100) {
    recommendations.push('High number of security events detected - review and investigate');
  }

  return { trend, recommendations };
}

/**
 * Check system health and security status
 */
export async function performSecurityHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail';
    message: string;
  }>;
}> {
  const checks = [];

  // Check 1: Recent critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  checks.push({
    name: 'Critical Alerts',
    status: criticalAlerts === 0 ? 'pass' : 'fail',
    message: `${criticalAlerts} critical alert(s) in memory`
  });

  // Check 2: Failed login rate
  const failedLogins = await prisma.loginHistory.count({
    where: {
      success: false,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });
  checks.push({
    name: 'Failed Logins',
    status: failedLogins < 50 ? 'pass' : 'fail',
    message: `${failedLogins} failed login(s) in last hour`
  });

  // Check 3: Unresolved security events
  const unresolvedEvents = await prisma.securityEvent.count({
    where: { resolved: false, severity: { in: ['high', 'critical'] } }
  });
  checks.push({
    name: 'Unresolved Events',
    status: unresolvedEvents < 5 ? 'pass' : 'fail',
    message: `${unresolvedEvents} unresolved high/critical event(s)`
  });

  const failedChecks = checks.filter(c => c.status === 'fail').length;
  const status = failedChecks === 0 ? 'healthy' : failedChecks < 2 ? 'warning' : 'critical';

  return { status, checks };
}

// Start monitoring on module load
console.log('🔍 Security monitoring system initialized');
