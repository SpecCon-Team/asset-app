import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignTicketsForTesting() {
  console.log('\n🎫 ASSIGNING TICKETS FOR TESTING\n');
  console.log('═'.repeat(80));

  try {
    // Get technician users
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN'
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    if (technicians.length === 0) {
      console.log('❌ No technicians found in database!');
      return;
    }

    console.log(`\n👨‍💻 Found ${technicians.length} technician(s):\n`);
    technicians.forEach((tech, index) => {
      console.log(`${index + 1}. ${tech.name} (${tech.email})`);
      console.log(`   ID: ${tech.id}`);
    });

    // Get unassigned tickets
    const unassignedTickets = await prisma.ticket.findMany({
      where: {
        assignedToId: null
      },
      orderBy: {
        priority: 'desc' // Assign high priority first
      }
    });

    console.log(`\n📋 Found ${unassignedTickets.length} unassigned ticket(s)\n`);

    if (unassignedTickets.length === 0) {
      console.log('ℹ️  All tickets are already assigned!');
      return;
    }

    // Assign tickets round-robin to technicians
    console.log('📌 Assigning tickets...\n');

    const assignments = [];
    for (let i = 0; i < unassignedTickets.length; i++) {
      const ticket = unassignedTickets[i];
      const tech = technicians[i % technicians.length]; // Round-robin

      try {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { assignedToId: tech.id }
        });

        assignments.push({
          ticket: ticket.number,
          title: ticket.title,
          priority: ticket.priority,
          assignedTo: tech.name
        });

        console.log(`✅ ${ticket.number} (${ticket.priority.toUpperCase()}) → ${tech.name}`);
      } catch (error) {
        console.log(`❌ Failed to assign ${ticket.number}: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '─'.repeat(80));
    console.log(`\n📊 Assignment Summary:\n`);

    const techSummary = technicians.map(tech => ({
      name: tech.name,
      count: assignments.filter(a => a.assignedTo === tech.name).length
    }));

    techSummary.forEach(summary => {
      console.log(`   ${summary.name}: ${summary.count} ticket(s)`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Assignment complete!\n');
    console.log('💡 Run "node checkTicketAssignments.mjs" to verify\n');

  } catch (error) {
    console.error('❌ Error assigning tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTicketsForTesting();
