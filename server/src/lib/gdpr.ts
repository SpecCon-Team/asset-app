/**
 * GDPR Compliance Library
 * Handles data export, deletion, and anonymization
 */

import { prisma } from './prisma';
import { logAudit } from './auditLog';

/**
 * Export all user data in JSON format (GDPR Article 20 - Right to Data Portability)
 */
export async function exportUserData(userId: string) {
  try {
    // Fetch all user-related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tickets: {
          include: {
            comments: true,
            asset: true,
          },
        },
        assigned: {
          include: {
            comments: true,
            asset: true,
          },
        },
        assets: true,
        comments: true,
        notifications: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive fields before export
    const sanitizedUser = {
      ...user,
      password: undefined,
      twoFactorSecret: undefined,
      backupCodes: undefined,
      resetPasswordToken: undefined,
      resetPasswordExpiry: undefined,
      verificationOTP: undefined,
      verificationExpiry: undefined,
      loginAttempts: undefined,
      lockoutUntil: undefined,
    };

    return {
      exportDate: new Date().toISOString(),
      userData: sanitizedUser,
      summary: {
        totalTicketsCreated: user.tickets.length,
        totalTicketsAssigned: user.assigned.length,
        totalAssets: user.assets.length,
        totalComments: user.comments.length,
        totalNotifications: user.notifications.length,
      },
    };
  } catch (error) {
    console.error('Data export error:', error);
    throw error;
  }
}

/**
 * Anonymize user data (GDPR Article 17 - Right to Erasure)
 * Keeps records for legal/audit purposes but removes PII
 */
export async function anonymizeUserData(userId: string, requestedBy: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate anonymized values
    const anonymizedEmail = `deleted_${userId.substring(0, 8)}@anonymized.local`;
    const anonymizedName = `Deleted User ${userId.substring(0, 8)}`;

    // Anonymize user data
    const anonymizedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        name: anonymizedName,
        phone: null,
        bio: null,
        profilePicture: null,
        department: null,
        location: null,
        password: 'ANONYMIZED',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
        verificationOTP: null,
        verificationExpiry: null,
      },
    });

    return {
      success: true,
      anonymizedUserId: anonymizedUser.id,
      anonymizedEmail: anonymizedEmail,
      message: 'User data has been anonymized successfully',
    };
  } catch (error) {
    console.error('Anonymization error:', error);
    throw error;
  }
}

/**
 * Permanently delete user and all related data
 * WARNING: This is irreversible and should only be used when legally required
 */
export async function permanentlyDeleteUser(userId: string) {
  try {
    // Delete in order due to foreign key constraints
    await prisma.$transaction([
      // Delete comments
      prisma.comment.deleteMany({ where: { authorId: userId } }),

      // Delete notifications
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { senderId: userId } }),

      // Unassign tickets
      prisma.ticket.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null },
      }),

      // Delete tickets created by user
      prisma.ticket.deleteMany({ where: { createdById: userId } }),

      // Unassign assets
      prisma.asset.updateMany({
        where: { ownerId: userId },
        data: { ownerId: null },
      }),

      // Finally delete the user
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return {
      success: true,
      message: 'User and all related data permanently deleted',
    };
  } catch (error) {
    console.error('Permanent deletion error:', error);
    throw error;
  }
}

/**
 * Get data retention summary for a user
 */
export async function getDataRetentionSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tickets: true,
      assigned: true,
      assets: true,
      comments: true,
      notifications: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const accountAge = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  return {
    userId: user.id,
    accountCreated: user.createdAt,
    accountAgeDays: accountAge,
    dataCategories: {
      personalInfo: {
        fields: ['email', 'name', 'phone', 'bio', 'profilePicture', 'department', 'location'],
        canDelete: true,
      },
      activityData: {
        ticketsCreated: user.tickets.length,
        ticketsAssigned: user.assigned.length,
        comments: user.comments.length,
        canDelete: false, // Keep for audit trail
        retentionPolicy: 'Retained for business records',
      },
      assetData: {
        assetsOwned: user.assets.length,
        canDelete: false,
        retentionPolicy: 'Retained for asset tracking',
      },
      notifications: {
        count: user.notifications.length,
        canDelete: true,
        retentionPolicy: 'Can be deleted anytime',
      },
    },
    recommendations: {
      canAnonymize: true,
      canExport: true,
      shouldRetain: user.tickets.length > 0 || user.assigned.length > 0,
    },
  };
}

/**
 * Clean up old data based on retention policies
 */
export async function cleanupOldData(daysToRetain: number = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToRetain);

  try {
    // Delete old resolved tickets (after retention period)
    const deletedTickets = await prisma.ticket.deleteMany({
      where: {
        status: 'resolved',
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    // Delete old notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Clean up old audit logs (keep 2 years)
    const auditCutoff = new Date();
    auditCutoff.setDate(auditCutoff.getDate() - 730); // 2 years

    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: auditCutoff,
        },
      },
    });

    return {
      success: true,
      deletedTickets: deletedTickets.count,
      deletedNotifications: deletedNotifications.count,
      deletedAuditLogs: deletedAuditLogs.count,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
}

/**
 * Generate privacy report for user
 */
export async function generatePrivacyReport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const retentionSummary = await getDataRetentionSummary(userId);

  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      accountCreated: user.createdAt,
    },
    dataProcessing: {
      purposes: [
        'Asset management and tracking',
        'Ticket and support management',
        'User authentication and access control',
        'System audit and security',
      ],
      legalBasis: 'Legitimate business interest and user consent',
      dataRetention: `${retentionSummary.accountAgeDays} days`,
    },
    yourRights: {
      rightToAccess: 'You can export your data anytime',
      rightToRectification: 'You can update your profile information',
      rightToErasure: 'You can request account anonymization',
      rightToDataPortability: 'You can download your data in JSON format',
      rightToObject: 'You can object to data processing (contact admin)',
    },
    dataSharing: {
      thirdParties: 'None - data is stored locally',
      internationalTransfers: 'None',
    },
    security: {
      encryption: 'Passwords are hashed with bcrypt',
      twoFactorAuth: user.twoFactorEnabled ? 'Enabled' : 'Available',
      accessControl: 'Role-based permissions',
    },
  };
}
