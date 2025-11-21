import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import SLA engine logic
function addBusinessMinutes(startDate, minutes, businessHoursOnly) {
  if (!businessHoursOnly) {
    return new Date(startDate.getTime() + minutes * 60 * 1000);
  }

  let date = new Date(startDate);
  let remainingMinutes = minutes;

  while (remainingMinutes > 0) {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    if (dayOfWeek === 0) {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
      continue;
    } else if (dayOfWeek === 6) {
      date.setDate(date.getDate() + 2);
      date.setHours(9, 0, 0, 0);
      continue;
    }

    if (hour < 9) {
      date.setHours(9, 0, 0, 0);
      continue;
    }

    if (hour >= 17) {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
      continue;
    }

    const minutesUntilEndOfDay = (17 - hour) * 60 - date.getMinutes();
    const minutesToAdd = Math.min(remainingMinutes, minutesUntilEndOfDay);

    date = new Date(date.getTime() + minutesToAdd * 60 * 1000);
    remainingMinutes -= minutesToAdd;

    if (date.getHours() >= 17) {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    }
  }

  return date;
}

async function createMissingSLAs() {
  console.log('=== Creating Missing SLAs ===\n');

  // Get all tickets
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      number: true,
      priority: true,
      status: true,
      createdAt: true
    }
  });

  // Get existing SLAs
  const existingSLAs = await prisma.ticketSLA.findMany({
    select: { ticketId: true }
  });
  const existingSLATicketIds = new Set(existingSLAs.map(sla => sla.ticketId));

  // Get active SLA policies
  const policies = await prisma.sLAPolicy.findMany({
    where: { isActive: true }
  });

  console.log(`📋 Found ${tickets.length} tickets`);
  console.log(`✅ ${existingSLAs.length} already have SLAs`);
  console.log(`📝 ${policies.length} active SLA policies`);
  console.log('');

  let created = 0;
  let skipped = 0;

  for (const ticket of tickets) {
    // Skip if already has SLA
    if (existingSLATicketIds.has(ticket.id)) {
      skipped++;
      continue;
    }

    // Find matching policy
    const policy = policies.find(p => p.priority === ticket.priority);
    if (!policy) {
      console.log(`⚠️  No policy for ${ticket.number} (${ticket.priority})`);
      skipped++;
      continue;
    }

    // Calculate deadlines from ticket creation time
    const startTime = ticket.createdAt;
    const responseDeadline = addBusinessMinutes(
      startTime,
      policy.responseTimeMinutes,
      policy.businessHoursOnly
    );
    const resolutionDeadline = addBusinessMinutes(
      startTime,
      policy.resolutionTimeMinutes,
      policy.businessHoursOnly
    );

    // Determine current status
    const now = new Date();
    let status = 'on_track';
    let responseBreached = false;
    let resolutionBreached = false;

    // Check if resolved tickets met their SLA
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      // For resolved tickets, assume they were resolved at current time (we don't have exact time)
      // This is not perfect but better than nothing
      if (now > resolutionDeadline) {
        resolutionBreached = true;
        status = 'breached';
      }
    } else {
      // For active tickets, check current time
      if (now > responseDeadline) {
        responseBreached = true;
        status = 'breached';
      } else if (now > resolutionDeadline) {
        resolutionBreached = true;
        status = 'breached';
      }
    }

    try {
      await prisma.ticketSLA.create({
        data: {
          ticketId: ticket.id,
          policyId: policy.id,
          responseDeadline,
          resolutionDeadline,
          firstResponseAt: null, // We don't know when first response was
          resolvedAt: (ticket.status === 'closed' || ticket.status === 'resolved') ? now : null,
          status,
          responseBreached,
          resolutionBreached,
          warningsSent: 0,
          escalated: false
        }
      });

      created++;
      console.log(`✅ Created SLA for ${ticket.number} (${ticket.priority})`);
    } catch (error) {
      console.error(`❌ Failed to create SLA for ${ticket.number}:`, error.message);
    }
  }

  console.log('');
  console.log(`\n=== Summary ===`);
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${tickets.length}`);

  await prisma.$disconnect();
}

createMissingSLAs().catch(console.error);
