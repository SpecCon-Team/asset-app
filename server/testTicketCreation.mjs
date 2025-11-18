import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTicketCreation() {
  try {
    console.log('🧪 Testing Ticket Creation\n');

    // Find a test user
    const user = await prisma.user.findFirst({
      where: {
        phone: { contains: '606344230' }
      }
    });

    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Try to create a ticket
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(5, '0')}`;

    console.log(`\nCreating ticket: ${ticketNumber}`);

    const ticket = await prisma.ticket.create({
      data: {
        number: ticketNumber,
        title: 'Test ticket from script',
        description: 'My printer is not working',
        priority: 'medium',
        status: 'open',
        createdById: user.id,
      },
    });

    console.log(`✅ Ticket created successfully!`);
    console.log(JSON.stringify(ticket, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTicketCreation();
