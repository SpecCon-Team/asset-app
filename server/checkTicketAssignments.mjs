import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTicketAssignments() {
  console.log('\n🎫 TICKET ASSIGNMENT STATUS\n');
  console.log('═'.repeat(80));

  try {
    // Get all tickets with their assigned users
    const tickets = await prisma.ticket.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Total Tickets: ${tickets.length}\n`);

    // Count by status
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status.toUpperCase()}: ${count}`);
    });

    // Count by assignment
    const assignedCount = tickets.filter(t => t.assignedToId !== null).length;
    const unassignedCount = tickets.filter(t => t.assignedToId === null).length;

    console.log('\n👥 Assignment Breakdown:');
    console.log(`   Assigned: ${assignedCount}`);
    console.log(`   Unassigned: ${unassignedCount}`);

    // Group by technician
    const technicianGroups = tickets.reduce((acc, ticket) => {
      if (ticket.assignedToId) {
        const key = ticket.assignedTo.email;
        if (!acc[key]) {
          acc[key] = {
            name: ticket.assignedTo.name,
            email: ticket.assignedTo.email,
            role: ticket.assignedTo.role,
            tickets: []
          };
        }
        acc[key].tickets.push(ticket);
      }
      return acc;
    }, {});

    if (Object.keys(technicianGroups).length > 0) {
      console.log('\n👨‍💻 Tickets by Technician:');
      Object.values(technicianGroups).forEach(tech => {
        console.log(`\n   ${tech.name} (${tech.email}) - ${tech.role}`);
        console.log(`   Total: ${tech.tickets.length} ticket(s)`);

        const techStatusCounts = tech.tickets.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {});

        Object.entries(techStatusCounts).forEach(([status, count]) => {
          console.log(`      - ${status}: ${count}`);
        });
      });
    }

    // Show unassigned tickets
    if (unassignedCount > 0) {
      console.log('\n\n📋 UNASSIGNED TICKETS:');
      console.log('─'.repeat(80));

      const unassigned = tickets.filter(t => t.assignedToId === null);
      unassigned.forEach((ticket, index) => {
        console.log(`\n${index + 1}. ${ticket.number} - ${ticket.title}`);
        console.log(`   Status: ${ticket.status.toUpperCase()} | Priority: ${ticket.priority.toUpperCase()}`);
        console.log(`   Created by: ${ticket.createdBy.name || ticket.createdBy.email}`);
        console.log(`   Created at: ${new Date(ticket.createdAt).toLocaleString()}`);
      });
    }

    // Show assigned tickets
    if (assignedCount > 0) {
      console.log('\n\n✅ ASSIGNED TICKETS:');
      console.log('─'.repeat(80));

      const assigned = tickets.filter(t => t.assignedToId !== null);
      assigned.forEach((ticket, index) => {
        console.log(`\n${index + 1}. ${ticket.number} - ${ticket.title}`);
        console.log(`   Status: ${ticket.status.toUpperCase()} | Priority: ${ticket.priority.toUpperCase()}`);
        console.log(`   Assigned to: ${ticket.assignedTo.name} (${ticket.assignedTo.email})`);
        console.log(`   Created by: ${ticket.createdBy.name || ticket.createdBy.email}`);
        console.log(`   Created at: ${new Date(ticket.createdAt).toLocaleString()}`);
      });
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Check complete!\n');

  } catch (error) {
    console.error('❌ Error checking ticket assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketAssignments();
