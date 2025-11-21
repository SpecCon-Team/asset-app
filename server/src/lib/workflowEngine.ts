import { prisma } from './prisma';
import { createNotificationIfNotExists } from './notificationHelper';
import { whatsappService } from './whatsapp';
import crypto from 'crypto';

// Workflow Engine - Executes workflows based on triggers and conditions

export interface WorkflowCondition {
  field: string; // e.g., 'priority', 'status', 'title', 'description'
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface WorkflowAction {
  type: 'assign' | 'change_status' | 'change_priority' | 'add_comment' | 'send_notification' | 'send_email' | 'send_whatsapp';
  params: {
    userId?: string;
    status?: string;
    priority?: string;
    comment?: string;
    message?: string;
    recipients?: string[];
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  entityType: 'ticket' | 'asset';
  trigger: 'created' | 'status_changed' | 'assigned' | 'priority_changed' | 'updated';
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
}

class WorkflowEngine {
  /**
   * Execute workflows for a given trigger and entity
   */
  async executeWorkflows(
    entityType: 'ticket' | 'asset',
    trigger: string,
    entityId: string,
    entityData: any,
    previousData?: any
  ): Promise<void> {
    try {
      // Fetch active workflows matching the trigger
      const workflows = await prisma.workflowTemplate.findMany({
        where: {
          entityType,
          trigger,
          isActive: true,
        },
        orderBy: { priority: 'desc' }, // Higher priority first
      });

      console.log(`🔄 Found ${workflows.length} workflows for ${entityType}:${trigger}`);

      // Execute each workflow
      for (const workflow of workflows) {
        await this.executeWorkflow(workflow, entityId, entityData, previousData);
      }
    } catch (error) {
      console.error('❌ Workflow execution error:', error);
    }
  }

  /**
   * Execute a single workflow
   */
  private async executeWorkflow(
    workflow: any,
    entityId: string,
    entityData: any,
    previousData?: any
  ): Promise<void> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🔄 Executing workflow: ${workflow.name} (${workflow.id})`);

      // Create execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          entityType: workflow.entityType,
          entityId,
          status: 'running',
        },
      });

      // Evaluate conditions
      const conditionsMet = this.evaluateConditions(
        workflow.conditions as WorkflowCondition[] || [],
        entityData,
        previousData
      );

      if (!conditionsMet) {
        console.log(`⏭️  Workflow ${workflow.name}: Conditions not met, skipping`);
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'completed',
            result: { skipped: true, reason: 'conditions_not_met' },
            completedAt: new Date(),
          },
        });
        return;
      }

      // Execute actions
      const actions = workflow.actions as WorkflowAction[];
      const results: any[] = [];

      for (const action of actions) {
        const result = await this.executeAction(action, entityId, entityData);
        results.push(result);
      }

      // Update execution record
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          result: { actions: results },
          completedAt: new Date(),
        },
      });

      console.log(`✅ Workflow ${workflow.name} completed successfully`);
    } catch (error: any) {
      console.error(`❌ Workflow ${workflow.name} failed:`, error);

      // Log failure
      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          entityType: workflow.entityType,
          entityId,
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(
    conditions: WorkflowCondition[],
    entityData: any,
    previousData?: any
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always execute
    }

    // All conditions must be met (AND logic)
    return conditions.every((condition) => {
      const fieldValue = this.getFieldValue(entityData, condition.field);
      const previousValue = previousData ? this.getFieldValue(previousData, condition.field) : undefined;

      return this.evaluateCondition(condition, fieldValue, previousValue);
    });
  }

  /**
   * Get field value from entity data (supports nested fields)
   */
  private getFieldValue(data: any, field: string): any {
    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: WorkflowCondition,
    fieldValue: any,
    previousValue?: any
  ): boolean {
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;

      case 'not_equals':
        return fieldValue !== value;

      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());

      case 'greater_than':
        return Number(fieldValue) > Number(value);

      case 'less_than':
        return Number(fieldValue) < Number(value);

      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);

      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);

      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Execute a workflow action
   */
  private async executeAction(
    action: WorkflowAction,
    entityId: string,
    entityData: any
  ): Promise<any> {
    console.log(`  🎬 Executing action: ${action.type}`);

    switch (action.type) {
      case 'assign':
        return this.actionAssign(entityId, action.params.userId!);

      case 'change_status':
        return this.actionChangeStatus(entityId, action.params.status!);

      case 'change_priority':
        return this.actionChangePriority(entityId, action.params.priority!);

      case 'add_comment':
        return this.actionAddComment(entityId, action.params.comment!);

      case 'send_notification':
        return this.actionSendNotification(entityId, entityData, action.params);

      case 'send_whatsapp':
        return this.actionSendWhatsApp(entityId, entityData, action.params);

      default:
        console.warn(`Unknown action type: ${action.type}`);
        return { success: false, error: 'Unknown action type' };
    }
  }

  /**
   * Action: Assign ticket to user
   */
  private async actionAssign(ticketId: string, userId: string): Promise<any> {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { assignedToId: userId },
        include: { assignedTo: true },
      });

      console.log(`  ✅ Assigned ticket ${ticketId} to ${ticket.assignedTo?.name || userId}`);
      return { success: true, assignedTo: ticket.assignedTo };
    } catch (error: any) {
      console.error(`  ❌ Failed to assign ticket:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Action: Change ticket status
   */
  private async actionChangeStatus(ticketId: string, status: string): Promise<any> {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status },
      });

      console.log(`  ✅ Changed ticket ${ticketId} status to ${status}`);
      return { success: true, status };
    } catch (error: any) {
      console.error(`  ❌ Failed to change status:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Action: Change ticket priority
   */
  private async actionChangePriority(ticketId: string, priority: string): Promise<any> {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { priority },
      });

      console.log(`  ✅ Changed ticket ${ticketId} priority to ${priority}`);
      return { success: true, priority };
    } catch (error: any) {
      console.error(`  ❌ Failed to change priority:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Action: Add comment to ticket
   */
  private async actionAddComment(ticketId: string, content: string): Promise<any> {
    try {
      // Use system user for automated comments
      const systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (!systemUser) {
        throw new Error('System user not found');
      }

      const commentContent = `🤖 ${content}`;

      // Create content hash for duplicate detection
      const contentHash = crypto
        .createHash('md5')
        .update(commentContent + ticketId + systemUser.id)
        .digest('hex');

      const comment = await prisma.comment.create({
        data: {
          ticketId,
          authorId: systemUser.id,
          content: commentContent,
          contentHash,
        },
      });

      console.log(`  ✅ Added comment to ticket ${ticketId}`);
      return { success: true, commentId: comment.id };
    } catch (error: any) {
      console.error(`  ❌ Failed to add comment:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Action: Send notification
   */
  private async actionSendNotification(
    ticketId: string,
    entityData: any,
    params: any
  ): Promise<any> {
    try {
      const recipients = params.recipients || [];
      const message = params.message || 'You have a new notification';

      for (const userId of recipients) {
        await createNotificationIfNotExists({
          userId,
          type: 'workflow_action',
          title: 'Workflow Notification',
          message,
          ticketId,
        });
      }

      console.log(`  ✅ Sent notifications to ${recipients.length} users`);
      return { success: true, recipientCount: recipients.length };
    } catch (error: any) {
      console.error(`  ❌ Failed to send notification:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Action: Send WhatsApp message
   */
  private async actionSendWhatsApp(
    ticketId: string,
    entityData: any,
    params: any
  ): Promise<any> {
    try {
      const message = params.message || 'You have a new update';
      const recipients = params.recipients || [];

      // Get users with WhatsApp enabled
      const users = await prisma.user.findMany({
        where: {
          id: { in: recipients },
          whatsAppNotifications: true,
          phone: { not: null },
        },
      });

      let sentCount = 0;
      for (const user of users) {
        if (user.phone) {
          await whatsappService.sendMessage(user.phone, message);
          sentCount++;
        }
      }

      console.log(`  ✅ Sent WhatsApp messages to ${sentCount} users`);
      return { success: true, sentCount };
    } catch (error: any) {
      console.error(`  ❌ Failed to send WhatsApp:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();
