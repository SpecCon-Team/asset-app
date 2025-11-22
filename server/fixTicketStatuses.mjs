/**
 * Fix Invalid Ticket Statuses
 *
 * This script updates tickets with invalid status values to valid ones.
 * Valid statuses: 'open', 'in_progress', 'closed'
 * Invalid statuses to fix: 'pending', 'resolved', etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTicketStatuses() {
  console.log('🔍 Checking for tickets with invalid statuses...\n');

  try {
    // Find all tickets
    const allTickets = await prisma.ticket.findMany({
      select: {
        id: true,
        number: true,
        status: true,
      },
    });

    console.log(`Found ${allTickets.length} total tickets\n`);

    // Map invalid statuses to valid ones
    const statusMapping = {
      'pending': 'open',
      'resolved': 'closed',
      'completed': 'closed',
      'done': 'closed',
      'todo': 'open',
      'backlog': 'open',
      // Add any other invalid statuses you find
    };

    const validStatuses = ['open', 'in_progress', 'closed'];
    const ticketsToFix = allTickets.filter(t => !validStatuses.includes(t.status));

    if (ticketsToFix.length === 0) {
      console.log('✅ All tickets have valid statuses!');
      return;
    }

    console.log(`⚠️  Found ${ticketsToFix.length} tickets with invalid statuses:\n`);

    // Group by status
    const statusCounts = {};
    ticketsToFix.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      const newStatus = statusMapping[status] || 'open';
      console.log(`  - "${status}": ${count} tickets → will change to "${newStatus}"`);
    });

    console.log('\n🔧 Fixing statuses...\n');

    let fixed = 0;
    for (const ticket of ticketsToFix) {
      const newStatus = statusMapping[ticket.status] || 'open';

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: newStatus },
      });

      console.log(`  ✓ ${ticket.number || ticket.id}: "${ticket.status}" → "${newStatus}"`);
      fixed++;
    }

    console.log(`\n✅ Successfully fixed ${fixed} tickets!`);
    console.log('\nStatus summary:');

    // Show final counts
    const updatedTickets = await prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
    });

    updatedTickets.forEach(group => {
      console.log(`  - ${group.status}: ${group._count} tickets`);
    });

  } catch (error) {
    console.error('❌ Error fixing ticket statuses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixTicketStatuses()
  .then(() => {
    console.log('\n🎉 All done! Your tickets now have valid statuses.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
