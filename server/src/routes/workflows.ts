import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { workflowEngine } from '../lib/workflowEngine';
import { autoAssignmentEngine } from '../lib/autoAssignment';
import { slaEngine } from '../lib/slaEngine';

const router = Router();

// ==================== WORKFLOW TEMPLATES ====================

// Get all workflows
router.get('/templates', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const workflows = await prisma.workflowTemplate.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(workflows);
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    res.status(500).json({ message: 'Failed to fetch workflows' });
  }
});

// Get single workflow
router.get('/templates/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const workflow = await prisma.workflowTemplate.findUnique({
      where: { id },
      include: {
        executions: {
          take: 10,
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Failed to fetch workflow:', error);
    res.status(500).json({ message: 'Failed to fetch workflow' });
  }
});

// Create workflow
const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  entityType: z.enum(['ticket', 'asset']),
  trigger: z.enum(['created', 'status_changed', 'assigned', 'priority_changed', 'updated']),
  conditions: z.array(z.any()).optional(),
  actions: z.array(z.any()),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
});

router.post('/templates', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createWorkflowSchema.parse(req.body);

    const workflow = await prisma.workflowTemplate.create({
      data: {
        ...data,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json(workflow);
  } catch (error: any) {
    console.error('Failed to create workflow:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid workflow data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/templates/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createWorkflowSchema.partial().parse(req.body);

    const workflow = await prisma.workflowTemplate.update({
      where: { id },
      data,
    });

    res.json(workflow);
  } catch (error: any) {
    console.error('Failed to update workflow:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid workflow data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/templates/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.workflowTemplate.delete({
      where: { id },
    });

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    res.status(500).json({ message: 'Failed to delete workflow' });
  }
});

// Toggle workflow active status
router.patch('/templates/:id/toggle', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const workflow = await prisma.workflowTemplate.findUnique({
      where: { id },
    });

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const updated = await prisma.workflowTemplate.update({
      where: { id },
      data: { isActive: !workflow.isActive },
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to toggle workflow:', error);
    res.status(500).json({ message: 'Failed to toggle workflow' });
  }
});

// Test workflow (dry run)
router.post('/templates/:id/test', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { entityId } = req.body;

    // TODO: Implement dry run testing
    res.json({ message: 'Workflow test not yet implemented' });
  } catch (error) {
    console.error('Failed to test workflow:', error);
    res.status(500).json({ message: 'Failed to test workflow' });
  }
});

// ==================== WORKFLOW EXECUTIONS ====================

// Get workflow executions
router.get('/executions', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { workflowId, status, limit = '50' } = req.query;

    const where: any = {};
    if (workflowId) where.workflowId = workflowId as string;
    if (status) where.status = status as string;

    const executions = await prisma.workflowExecution.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { executedAt: 'desc' },
      include: {
        workflow: {
          select: { name: true },
        },
      },
    });

    res.json(executions);
  } catch (error) {
    console.error('Failed to fetch executions:', error);
    res.status(500).json({ message: 'Failed to fetch executions' });
  }
});

// ==================== AUTO-ASSIGNMENT RULES ====================

// Get all assignment rules
router.get('/assignment-rules', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const rules = await prisma.autoAssignmentRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(rules);
  } catch (error) {
    console.error('Failed to fetch assignment rules:', error);
    res.status(500).json({ message: 'Failed to fetch assignment rules' });
  }
});

// Create assignment rule
const createAssignmentRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  conditions: z.any(),
  assignmentType: z.enum(['round_robin', 'least_busy', 'skill_based', 'location_based', 'specific_user']),
  targetUserId: z.string().optional(),
  targetUserIds: z.array(z.string()).optional(),
});

router.post('/assignment-rules', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createAssignmentRuleSchema.parse(req.body);

    const rule = await prisma.autoAssignmentRule.create({
      data,
    });

    res.status(201).json(rule);
  } catch (error: any) {
    console.error('Failed to create assignment rule:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid rule data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create assignment rule' });
  }
});

// Update assignment rule
router.put('/assignment-rules/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createAssignmentRuleSchema.partial().parse(req.body);

    const rule = await prisma.autoAssignmentRule.update({
      where: { id },
      data,
    });

    res.json(rule);
  } catch (error: any) {
    console.error('Failed to update assignment rule:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid rule data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update assignment rule' });
  }
});

// Delete assignment rule
router.delete('/assignment-rules/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.autoAssignmentRule.delete({
      where: { id },
    });

    res.json({ message: 'Assignment rule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete assignment rule:', error);
    res.status(500).json({ message: 'Failed to delete assignment rule' });
  }
});

// Toggle assignment rule
router.patch('/assignment-rules/:id/toggle', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const rule = await prisma.autoAssignmentRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ message: 'Assignment rule not found' });
    }

    const updated = await prisma.autoAssignmentRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to toggle assignment rule:', error);
    res.status(500).json({ message: 'Failed to toggle assignment rule' });
  }
});

// Get assignment stats
router.get('/assignment-stats', authenticate, requireRole('ADMIN', 'TECHNICIAN'), async (req: AuthRequest, res) => {
  try {
    const stats = await autoAssignmentEngine.getAssignmentStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch assignment stats:', error);
    res.status(500).json({ message: 'Failed to fetch assignment stats' });
  }
});

// ==================== SLA POLICIES ====================

// Get all SLA policies
router.get('/sla-policies', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const policies = await prisma.sLAPolicy.findMany({
      orderBy: { priority: 'asc' },
    });

    res.json(policies);
  } catch (error) {
    console.error('Failed to fetch SLA policies:', error);
    res.status(500).json({ message: 'Failed to fetch SLA policies' });
  }
});

// Create SLA policy
const createSLAPolicySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  responseTimeMinutes: z.number().min(1),
  resolutionTimeMinutes: z.number().min(1),
  businessHoursOnly: z.boolean().default(true),
  escalationEnabled: z.boolean().default(true),
  escalationUserId: z.string().nullable().optional(),
  notifyBeforeMinutes: z.number().default(30),
  isActive: z.boolean().default(true),
});

router.post('/sla-policies', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = createSLAPolicySchema.parse(req.body);

    const policy = await prisma.sLAPolicy.create({
      data,
    });

    res.status(201).json(policy);
  } catch (error: any) {
    console.error('Failed to create SLA policy:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid policy data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create SLA policy' });
  }
});

// Update SLA policy
router.put('/sla-policies/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = createSLAPolicySchema.partial().parse(req.body);

    const policy = await prisma.sLAPolicy.update({
      where: { id },
      data,
    });

    res.json(policy);
  } catch (error: any) {
    console.error('Failed to update SLA policy:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid policy data', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update SLA policy' });
  }
});

// Delete SLA policy
router.delete('/sla-policies/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.sLAPolicy.delete({
      where: { id },
    });

    res.json({ message: 'SLA policy deleted successfully' });
  } catch (error) {
    console.error('Failed to delete SLA policy:', error);
    res.status(500).json({ message: 'Failed to delete SLA policy' });
  }
});

// Get SLA statistics
router.get('/sla-stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const stats = await slaEngine.getSLAStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch SLA stats:', error);
    res.status(500).json({ message: 'Failed to fetch SLA stats' });
  }
});

// Get ticket SLA details
router.get('/ticket-sla/:ticketId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { ticketId } = req.params;

    const sla = await prisma.ticketSLA.findUnique({
      where: { ticketId },
    });

    if (!sla) {
      return res.status(404).json({ message: 'SLA not found for this ticket' });
    }

    res.json(sla);
  } catch (error) {
    console.error('Failed to fetch ticket SLA:', error);
    res.status(500).json({ message: 'Failed to fetch ticket SLA' });
  }
});

export default router;
