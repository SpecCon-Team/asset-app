import { prisma } from './prisma';
import { createNotificationIfNotExists } from './notificationHelper';
import { whatsappService } from './whatsapp';

// SLA Engine - Tracks and enforces Service Level Agreements

class SLAEngine {
  /**
   * Create SLA tracker for a new ticket
   */
  async createSLA(ticketId: string): Promise<void> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        console.error('❌ Ticket not found');
        return;
      }

      // Find matching SLA policy
      const policy = await prisma.sLAPolicy.findFirst({
        where: {
          priority: ticket.priority,
          isActive: true,
        },
      });

      if (!policy) {
        console.log(`⚠️  No SLA policy for priority: ${ticket.priority}`);
        return;
      }

      // Calculate deadlines
      const now = new Date();
      const responseDeadline = this.addBusinessMinutes(
        now,
        policy.responseTimeMinutes,
        policy.businessHoursOnly
      );
      const resolutionDeadline = this.addBusinessMinutes(
        now,
        policy.resolutionTimeMinutes,
        policy.businessHoursOnly
      );

      // Create SLA tracker
      await prisma.ticketSLA.create({
        data: {
          ticketId,
          policyId: policy.id,
          responseDeadline,
          resolutionDeadline,
          status: 'on_track',
        },
      });

      console.log(`✅ SLA created for ticket ${ticketId}`);
      console.log(`   Response due: ${responseDeadline.toLocaleString()}`);
      console.log(`   Resolution due: ${resolutionDeadline.toLocaleString()}`);
    } catch (error) {
      console.error('❌ Failed to create SLA:', error);
    }
  }

  /**
   * Update SLA when ticket gets first response
   */
  async recordFirstResponse(ticketId: string): Promise<void> {
    try {
      const sla = await prisma.ticketSLA.findUnique({
        where: { ticketId },
      });

      if (!sla || sla.firstResponseAt) return;

      const now = new Date();
      const responseBreached = now > sla.responseDeadline;

      await prisma.ticketSLA.update({
        where: { ticketId },
        data: {
          firstResponseAt: now,
          responseBreached,
          status: responseBreached ? 'breached' : sla.status,
        },
      });

      if (responseBreached) {
        console.log(`⚠️  Response SLA breached for ticket ${ticketId}`);
        await this.handleSLABreach(ticketId, 'response');
      } else {
        console.log(`✅ Response SLA met for ticket ${ticketId}`);
      }
    } catch (error) {
      console.error('❌ Failed to record first response:', error);
    }
  }

  /**
   * Update SLA when ticket is resolved
   */
  async recordResolution(ticketId: string): Promise<void> {
    try {
      const sla = await prisma.ticketSLA.findUnique({
        where: { ticketId },
      });

      if (!sla || sla.resolvedAt) return;

      const now = new Date();
      const resolutionBreached = now > sla.resolutionDeadline;

      await prisma.ticketSLA.update({
        where: { ticketId },
        data: {
          resolvedAt: now,
          resolutionBreached,
          status: resolutionBreached ? 'breached' : 'on_track',
        },
      });

      if (resolutionBreached) {
        console.log(`⚠️  Resolution SLA breached for ticket ${ticketId}`);
        await this.handleSLABreach(ticketId, 'resolution');
      } else {
        console.log(`✅ Resolution SLA met for ticket ${ticketId}`);
      }
    } catch (error) {
      console.error('❌ Failed to record resolution:', error);
    }
  }

  /**
   * Check SLA status for all active tickets (run periodically)
   */
  async checkAllSLAs(): Promise<void> {
    try {
      const now = new Date();

      // Get all active ticket SLAs
      const slas = await prisma.ticketSLA.findMany({
        where: {
          resolvedAt: null,
        },
        include: {
          policy: await prisma.sLAPolicy.findMany(),
        },
      });

      console.log(`🔍 Checking ${slas.length} active SLAs`);

      for (const sla of slas) {
        await this.checkSingleSLA(sla, now);
      }

      console.log(`✅ SLA check complete`);
    } catch (error) {
      console.error('❌ Failed to check SLAs:', error);
    }
  }

  /**
   * Check individual SLA status
   */
  private async checkSingleSLA(sla: any, now: Date): Promise<void> {
    const policy = await prisma.sLAPolicy.findUnique({
      where: { id: sla.policyId },
    });

    if (!policy) return;

    // Check response SLA
    if (!sla.firstResponseAt && !sla.responseBreached) {
      const responseTimeLeft = sla.responseDeadline.getTime() - now.getTime();
      const warningTime = policy.notifyBeforeMinutes * 60 * 1000;

      if (responseTimeLeft <= 0) {
        // Breached!
        await prisma.ticketSLA.update({
          where: { id: sla.id },
          data: {
            responseBreached: true,
            status: 'breached',
          },
        });

        await this.handleSLABreach(sla.ticketId, 'response');
      } else if (responseTimeLeft <= warningTime && sla.warningsSent === 0) {
        // At risk
        await prisma.ticketSLA.update({
          where: { id: sla.id },
          data: {
            status: 'at_risk',
            warningsSent: 1,
          },
        });

        await this.sendSLAWarning(sla.ticketId, 'response', responseTimeLeft);
      }
    }

    // Check resolution SLA
    if (!sla.resolvedAt && !sla.resolutionBreached) {
      const resolutionTimeLeft = sla.resolutionDeadline.getTime() - now.getTime();
      const warningTime = policy.notifyBeforeMinutes * 60 * 1000;

      if (resolutionTimeLeft <= 0) {
        // Breached!
        await prisma.ticketSLA.update({
          where: { id: sla.id },
          data: {
            resolutionBreached: true,
            status: 'breached',
          },
        });

        await this.handleSLABreach(sla.ticketId, 'resolution');
      } else if (resolutionTimeLeft <= warningTime && sla.warningsSent < 2) {
        // At risk
        await prisma.ticketSLA.update({
          where: { id: sla.id },
          data: {
            status: 'at_risk',
            warningsSent: 2,
          },
        });

        await this.sendSLAWarning(sla.ticketId, 'resolution', resolutionTimeLeft);
      }
    }
  }

  /**
   * Handle SLA breach (escalate, notify, etc.)
   */
  private async handleSLABreach(ticketId: string, type: 'response' | 'resolution'): Promise<void> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!ticket) return;

    const sla = await prisma.ticketSLA.findUnique({
      where: { ticketId },
    });

    if (!sla) return;

    const policy = await prisma.sLAPolicy.findUnique({
      where: { id: sla.policyId },
    });

    if (!policy) return;

    // Send notifications
    const breachMessage = `⚠️ ${type === 'response' ? 'Response' : 'Resolution'} SLA breached for ticket #${ticket.number}`;

    // Notify assigned technician
    if (ticket.assignedToId) {
      await createNotificationIfNotExists({
        userId: ticket.assignedToId,
        type: 'sla_breach',
        title: 'SLA Breach Alert',
        message: breachMessage,
        ticketId,
      });
    }

    // Notify ticket creator
    await createNotificationIfNotExists({
      userId: ticket.createdById,
      type: 'sla_breach',
      title: 'SLA Status Update',
      message: `Your ticket #${ticket.number} has exceeded the ${type} time limit. We're working on it with high priority.`,
      ticketId,
    });

    // Escalate if enabled
    if (policy.escalationEnabled && policy.escalationUserId && !sla.escalated) {
      await prisma.ticketSLA.update({
        where: { id: sla.id },
        data: {
          escalated: true,
          escalatedAt: new Date(),
        },
      });

      await createNotificationIfNotExists({
        userId: policy.escalationUserId,
        type: 'sla_escalation',
        title: 'Ticket Escalated - SLA Breach',
        message: `Ticket #${ticket.number} has been escalated due to SLA breach`,
        ticketId,
      });

      console.log(`🚨 Ticket ${ticketId} escalated to ${policy.escalationUserId}`);
    }
  }

  /**
   * Send SLA warning notification
   */
  private async sendSLAWarning(ticketId: string, type: 'response' | 'resolution', timeLeft: number): Promise<void> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || !ticket.assignedToId) return;

    const minutes = Math.floor(timeLeft / (60 * 1000));
    const message = `⏰ ${type === 'response' ? 'Response' : 'Resolution'} SLA approaching for ticket #${ticket.number}. ${minutes} minutes remaining.`;

    await createNotificationIfNotExists({
      userId: ticket.assignedToId,
      type: 'sla_warning',
      title: 'SLA Warning',
      message,
      ticketId,
    });

    console.log(`⏰ SLA warning sent for ticket ${ticketId} (${minutes}m left)`);
  }

  /**
   * Add business minutes to a date
   */
  private addBusinessMinutes(startDate: Date, minutes: number, businessHoursOnly: boolean): Date {
    if (!businessHoursOnly) {
      // Simple addition
      return new Date(startDate.getTime() + minutes * 60 * 1000);
    }

    // Business hours: Mon-Fri, 9 AM - 5 PM
    const businessHoursPerDay = 8; // 9 AM to 5 PM
    const minutesPerBusinessDay = businessHoursPerDay * 60;

    let date = new Date(startDate);
    let remainingMinutes = minutes;

    while (remainingMinutes > 0) {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = date.getHours();

      // Skip weekends
      if (dayOfWeek === 0) {
        // Sunday -> go to Monday 9 AM
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
        continue;
      } else if (dayOfWeek === 6) {
        // Saturday -> go to Monday 9 AM
        date.setDate(date.getDate() + 2);
        date.setHours(9, 0, 0, 0);
        continue;
      }

      // Before business hours -> go to 9 AM
      if (hour < 9) {
        date.setHours(9, 0, 0, 0);
        continue;
      }

      // After business hours -> go to next day 9 AM
      if (hour >= 17) {
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
        continue;
      }

      // During business hours -> add time
      const minutesUntilEndOfDay = (17 - hour) * 60 - date.getMinutes();
      const minutesToAdd = Math.min(remainingMinutes, minutesUntilEndOfDay);

      date = new Date(date.getTime() + minutesToAdd * 60 * 1000);
      remainingMinutes -= minutesToAdd;

      // If we've reached end of business day
      if (date.getHours() >= 17) {
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
      }
    }

    return date;
  }

  /**
   * Get SLA statistics
   */
  async getSLAStats() {
    // Count only active (unresolved) tickets for current status
    const activeTotal = await prisma.ticketSLA.count({
      where: { resolvedAt: null }
    });
    const onTrack = await prisma.ticketSLA.count({
      where: {
        status: 'on_track',
        resolvedAt: null
      }
    });
    const atRisk = await prisma.ticketSLA.count({
      where: {
        status: 'at_risk',
        resolvedAt: null
      }
    });
    const breached = await prisma.ticketSLA.count({
      where: {
        status: 'breached',
        resolvedAt: null
      }
    });

    // Count all time breaches (including resolved tickets)
    const responseBreaches = await prisma.ticketSLA.count({ where: { responseBreached: true } });
    const resolutionBreaches = await prisma.ticketSLA.count({ where: { resolutionBreached: true } });

    // Calculate compliance rate based on all tickets (resolved + active)
    const totalAllTime = await prisma.ticketSLA.count();
    const totalBreachedAllTime = await prisma.ticketSLA.count({
      where: {
        OR: [
          { responseBreached: true },
          { resolutionBreached: true }
        ]
      }
    });
    const compliantTickets = totalAllTime - totalBreachedAllTime;
    const complianceRate = totalAllTime > 0 ? ((compliantTickets / totalAllTime) * 100).toFixed(1) : '100.0';

    return {
      total: activeTotal,
      onTrack,
      atRisk,
      breached,
      responseBreaches,
      resolutionBreaches,
      complianceRate,
    };
  }
}

// Export singleton instance
export const slaEngine = new SLAEngine();
