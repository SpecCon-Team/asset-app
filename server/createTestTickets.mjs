import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestTickets() {
  try {
    console.log('🎫 Creating Test Tickets for Dashboard Verification...\n');

    // Find a USER to create tickets for
    const user = await prisma.user.findFirst({
      where: { role: 'USER' }
    });

    if (!user) {
      console.log('❌ No USER found. Please create a user first.');
      await prisma.$disconnect();
      return;
    }

    console.log(`📧 Creating tickets for: ${user.email}`);
    console.log(`👤 User ID: ${user.id}\n`);

    // Delete existing test tickets for clean slate
    const deleted = await prisma.ticket.deleteMany({
      where: {
        createdById: user.id,
        title: {
          startsWith: '[TEST]'
        }
      }
    });

    console.log(`🗑️  Deleted ${deleted.count} old test tickets\n`);

    // Create test tickets with different statuses and priorities
    const testTickets = [
      {
        title: '[TEST] Printer Not Working',
        description: 'Office printer is showing error code E-01',
        status: 'open',
        priority: 'high',
        createdById: user.id
      },
      {
        title: '[TEST] Software Installation Request',
        description: 'Need Adobe Creative Suite installed on workstation',
        status: 'open',
        priority: 'medium',
        createdById: user.id
      },
      {
        title: '[TEST] Network Connectivity Issue',
        description: 'Cannot connect to shared drive',
        status: 'in_progress',
        priority: 'high',
        createdById: user.id
      },
      {
        title: '[TEST] Email Access Problem',
        description: 'Unable to access email on mobile device',
        status: 'in_progress',
        priority: 'medium',
        createdById: user.id
      },
      {
        title: '[TEST] Password Reset Required',
        description: 'Need to reset password for accounting system',
        status: 'closed',
        priority: 'low',
        createdById: user.id
      },
      {
        title: '[TEST] Computer Running Slow',
        description: 'Laptop performance has degraded significantly',
        status: 'closed',
        priority: 'medium',
        createdById: user.id
      },
      {
        title: '[TEST] URGENT: Server Down',
        description: 'Main application server is not responding',
        status: 'open',
        priority: 'critical',
        createdById: user.id
      },
      {
        title: '[TEST] New Equipment Request',
        description: 'Requesting wireless mouse and keyboard',
        status: 'open',
        priority: 'low',
        createdById: user.id
      }
    ];

    console.log('📝 Creating test tickets...\n');

    for (const ticketData of testTickets) {
      const seq = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
      const number = `TKT-${seq}`;

      await prisma.ticket.create({
        data: {
          ...ticketData,
          number
        }
      });

      console.log(`   ✅ ${ticketData.title}`);
      console.log(`      Status: ${ticketData.status} | Priority: ${ticketData.priority}`);
    }

    console.log('\n✨ Test tickets created successfully!\n');

    // Calculate expected counts
    const allTickets = await prisma.ticket.findMany({
      where: { createdById: user.id }
    });

    const openTickets = allTickets.filter(t => t.status === 'open');
    const inProgressTickets = allTickets.filter(t => t.status === 'in_progress');
    const closedTickets = allTickets.filter(t => t.status === 'closed');
    const highPriorityTickets = allTickets.filter(t =>
      (t.priority === 'high' || t.priority === 'critical') && t.status !== 'closed'
    );

    console.log('📊 EXPECTED DASHBOARD COUNTS:');
    console.log('┌─────────────────────┬───────┐');
    console.log('│ Card                │ Count │');
    console.log('├─────────────────────┼───────┤');
    console.log(`│ My Open Tickets     │   ${openTickets.length.toString().padStart(3)} │`);
    console.log(`│ In Progress         │   ${inProgressTickets.length.toString().padStart(3)} │`);
    console.log(`│ High Priority       │   ${highPriorityTickets.length.toString().padStart(3)} │`);
    console.log(`│ Resolved            │   ${closedTickets.length.toString().padStart(3)} │`);
    console.log('└─────────────────────┴───────┘\n');

    console.log('🎯 BREAKDOWN:\n');
    console.log('Open Tickets:');
    openTickets.forEach(t => console.log(`   - [${t.priority}] ${t.title}`));
    console.log('');
    console.log('In Progress Tickets:');
    inProgressTickets.forEach(t => console.log(`   - [${t.priority}] ${t.title}`));
    console.log('');
    console.log('High Priority (Open/In Progress):');
    highPriorityTickets.forEach(t => console.log(`   - [${t.status}] ${t.title}`));
    console.log('');
    console.log('Resolved Tickets:');
    closedTickets.forEach(t => console.log(`   - [${t.priority}] ${t.title}`));
    console.log('');

    console.log('✅ NEXT STEPS:');
    console.log(`   1. Login as: ${user.email}`);
    console.log('   2. Go to the dashboard');
    console.log('   3. Verify the counts match the table above');
    console.log('   4. Click on each card to see filtered tickets\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTickets();
