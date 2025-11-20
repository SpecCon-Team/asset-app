import { prisma } from './prisma';

// Auto-Assignment Engine - Intelligently assigns tickets to technicians

export interface AssignmentRule {
  id: string;
  name: string;
  isActive: boolean;
  priority: number;
  conditions: any;
  assignmentType: 'round_robin' | 'least_busy' | 'skill_based' | 'location_based' | 'specific_user';
  targetUserId?: string;
  targetUserIds?: string[];
}

class AutoAssignmentEngine {
  /**
   * Auto-assign a ticket based on active rules
   */
  async autoAssignTicket(ticketId: string): Promise<string | null> {
    try {
      console.log(`🎯 Auto-assigning ticket: ${ticketId}`);

      // Get ticket details
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          asset: true,
          createdBy: true,
        },
      });

      if (!ticket) {
        console.error('❌ Ticket not found');
        return null;
      }

      if (ticket.assignedToId) {
        console.log('⏭️  Ticket already assigned, skipping');
        return ticket.assignedToId;
      }

      // Get active assignment rules
      const rules = await prisma.autoAssignmentRule.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      });

      console.log(`📋 Found ${rules.length} active assignment rules`);

      // Try each rule until one matches
      for (const rule of rules) {
        const matches = this.evaluateRuleConditions(rule.conditions as any, ticket);

        if (matches) {
          console.log(`✅ Rule matched: ${rule.name}`);
          const assignedUserId = await this.assignByRule(rule, ticket);

          if (assignedUserId) {
            // Update ticket
            await prisma.ticket.update({
              where: { id: ticketId },
              data: { assignedToId: assignedUserId },
            });

            console.log(`✅ Ticket ${ticketId} auto-assigned to ${assignedUserId}`);
            return assignedUserId;
          }
        }
      }

      // No rules matched, try default assignment
      console.log('⚠️  No rules matched, using default assignment (least busy)');
      const defaultAssignee = await this.getDefaultAssignee();

      if (defaultAssignee) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { assignedToId: defaultAssignee.id },
        });

        console.log(`✅ Ticket ${ticketId} assigned to ${defaultAssignee.name} (default)`);
        return defaultAssignee.id;
      }

      console.log('❌ No technicians available for assignment');
      return null;
    } catch (error) {
      console.error('❌ Auto-assignment error:', error);
      return null;
    }
  }

  /**
   * Evaluate if rule conditions match the ticket
   */
  private evaluateRuleConditions(conditions: any, ticket: any): boolean {
    if (!conditions) return true;

    // Check priority
    if (conditions.priority && conditions.priority.length > 0) {
      if (!conditions.priority.includes(ticket.priority)) {
        return false;
      }
    }

    // Check status
    if (conditions.status && conditions.status.length > 0) {
      if (!conditions.status.includes(ticket.status)) {
        return false;
      }
    }

    // Check keywords in title/description
    if (conditions.keywords && conditions.keywords.length > 0) {
      const text = `${ticket.title} ${ticket.description}`.toLowerCase();
      const hasKeyword = conditions.keywords.some((keyword: string) =>
        text.includes(keyword.toLowerCase())
      );

      if (!hasKeyword) {
        return false;
      }
    }

    // Check asset type
    if (conditions.assetType && conditions.assetType.length > 0 && ticket.asset) {
      if (!conditions.assetType.includes(ticket.asset.asset_type)) {
        return false;
      }
    }

    // Check department
    if (conditions.department && conditions.department.length > 0) {
      const userDept = ticket.createdBy?.department;
      if (!userDept || !conditions.department.includes(userDept)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assign ticket based on rule type
   */
  private async assignByRule(rule: any, ticket: any): Promise<string | null> {
    switch (rule.assignmentType) {
      case 'specific_user':
        return this.assignToSpecificUser(rule.targetUserId);

      case 'round_robin':
        return this.assignRoundRobin(rule.targetUserIds || []);

      case 'least_busy':
        return this.assignToLeastBusy();

      case 'skill_based':
        return this.assignBySkill(ticket);

      case 'location_based':
        return this.assignByLocation(ticket);

      default:
        console.warn(`Unknown assignment type: ${rule.assignmentType}`);
        return null;
    }
  }

  /**
   * Assign to a specific user
   */
  private async assignToSpecificUser(userId: string | undefined): Promise<string | null> {
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId, isAvailable: true },
    });

    return user ? user.id : null;
  }

  /**
   * Round-robin assignment among specified users
   */
  private async assignRoundRobin(userIds: string[]): Promise<string | null> {
    if (!userIds || userIds.length === 0) return null;

    // Get available users
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        isAvailable: true,
      },
    });

    if (users.length === 0) return null;

    // Get last assigned user for round-robin
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        assignedToId: { in: userIds },
      },
      orderBy: { createdAt: 'desc' },
      select: { assignedToId: true },
    });

    if (!lastTicket) {
      // First assignment, use first user
      return users[0].id;
    }

    // Find next user in rotation
    const lastIndex = users.findIndex((u) => u.id === lastTicket.assignedToId);
    const nextIndex = (lastIndex + 1) % users.length;

    return users[nextIndex].id;
  }

  /**
   * Assign to technician with least active tickets
   */
  private async assignToLeastBusy(): Promise<string | null> {
    // Get all available technicians
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        isAvailable: true,
      },
      include: {
        assigned: {
          where: {
            status: { in: ['open', 'in_progress'] },
          },
        },
      },
    });

    if (technicians.length === 0) return null;

    // Sort by ticket count (ascending)
    technicians.sort((a, b) => a.assigned.length - b.assigned.length);

    return technicians[0].id;
  }

  /**
   * Assign based on skill matching
   * TODO: Implement skill matching logic when user skills are added
   */
  private async assignBySkill(ticket: any): Promise<string | null> {
    // For now, fall back to least busy
    console.log('⚠️  Skill-based assignment not yet implemented, using least busy');
    return this.assignToLeastBusy();
  }

  /**
   * Assign based on location proximity
   */
  private async assignByLocation(ticket: any): Promise<string | null> {
    const userLocation = ticket.createdBy?.location;
    const assetLocation = ticket.asset?.office_location;

    const targetLocation = assetLocation || userLocation;

    if (!targetLocation) {
      console.log('⚠️  No location info, using least busy');
      return this.assignToLeastBusy();
    }

    // Find technicians in same location
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        isAvailable: true,
        location: targetLocation,
      },
      include: {
        assigned: {
          where: {
            status: { in: ['open', 'in_progress'] },
          },
        },
      },
    });

    if (technicians.length === 0) {
      console.log('⚠️  No technicians in location, using any available');
      return this.assignToLeastBusy();
    }

    // Sort by ticket count
    technicians.sort((a, b) => a.assigned.length - b.assigned.length);

    return technicians[0].id;
  }

  /**
   * Get default assignee (least busy technician)
   */
  private async getDefaultAssignee() {
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        isAvailable: true,
      },
      include: {
        assigned: {
          where: {
            status: { in: ['open', 'in_progress'] },
          },
        },
      },
    });

    if (technicians.length === 0) return null;

    technicians.sort((a, b) => a.assigned.length - b.assigned.length);
    return technicians[0];
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats() {
    const rules = await prisma.autoAssignmentRule.findMany({
      where: { isActive: true },
    });

    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      include: {
        assigned: {
          where: {
            status: { in: ['open', 'in_progress'] },
          },
        },
      },
    });

    return {
      activeRules: rules.length,
      availableTechnicians: technicians.filter((t) => t.isAvailable).length,
      technicianWorkload: technicians.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        activeTickets: t.assigned.length,
        isAvailable: t.isAvailable,
      })),
    };
  }
}

// Export singleton instance
export const autoAssignmentEngine = new AutoAssignmentEngine();
