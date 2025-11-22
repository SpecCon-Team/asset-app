import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSLAData() {
  console.log('=== Checking SLA Data ===\n');

  // Check SLA Policies
  const policies = await prisma.sLAPolicy.findMany();
  console.log(`📋 SLA Policies: ${policies.length}`);
  if (policies.length > 0) {
    policies.forEach(policy => {
      console.log(`   - ${policy.name} (${policy.priority}) - ${policy.isActive ? 'Active' : 'Inactive'}`);
    });
  }
  console.log('');

  // Check Ticket SLAs
  const ticketSLAs = await prisma.ticketSLA.findMany();

  console.log(`🎫 Ticket SLAs: ${ticketSLAs.length}`);
  if (ticketSLAs.length > 0) {
    console.log('   First 5:');
    for (const sla of ticketSLAs.slice(0, 5)) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: sla.ticketId },
        select: { number: true, priority: true, status: true }
      });
      console.log(`   - Ticket #${ticket?.number || 'Unknown'} - Status: ${sla.status} - Response Breached: ${sla.responseBreached} - Resolution Breached: ${sla.resolutionBreached}`);
    }
  }
  console.log('');

  // Check tickets without SLAs
  const allTickets = await prisma.ticket.findMany({
    select: {
      id: true,
      number: true,
      priority: true,
      status: true
    }
  });

  const ticketIdsWithSLA = ticketSLAs.map(sla => sla.ticketId);
  const ticketsWithoutSLA = allTickets.filter(t => !ticketIdsWithSLA.includes(t.id));

  console.log(`⚠️  Tickets without SLA: ${ticketsWithoutSLA.length}`);
  if (ticketsWithoutSLA.length > 0) {
    console.log('   First 5:');
    ticketsWithoutSLA.slice(0, 5).forEach(ticket => {
      console.log(`   - Ticket #${ticket.number} (${ticket.priority}) - ${ticket.status}`);
    });
  }
  console.log('');

  // Get SLA Stats
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

  console.log('📊 SLA Statistics:');
  console.log(`   Active Tickets: ${activeTotal}`);
  console.log(`   On Track: ${onTrack}`);
  console.log(`   At Risk: ${atRisk}`);
  console.log(`   Breached: ${breached}`);
  console.log(`   Compliance Rate: ${complianceRate}%`);

  await prisma.$disconnect();
}

checkSLAData().catch(console.error);
