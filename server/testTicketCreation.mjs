import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTicketCreation() {
  try {
    console.log('🧪 Testing Rapid Ticket Creation (Unique Number Generation)\n');

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

    console.log(`✅ Found user: ${user.name} (${user.email})\n`);

    // Test: Create 5 tickets rapidly to ensure no duplicate numbers
    console.log('Creating 5 tickets in rapid succession...\n');

    const tickets = [];
    const ticketNumbers = new Set();

    for (let i = 1; i <= 5; i++) {
      // Generate unique ticket number with milliseconds and random suffix
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const ticketNumber = `TKT-${timestamp}-${randomSuffix}`;

      console.log(`${i}. Creating ticket: ${ticketNumber}`);

      const ticket = await prisma.ticket.create({
        data: {
          number: ticketNumber,
          title: `Test ticket ${i} - Rapid creation test`,
          description: `Testing unique ticket number generation - Ticket ${i}`,
          priority: 'medium',
          status: 'open',
          createdById: user.id,
        },
      });

      tickets.push(ticket);
      ticketNumbers.add(ticket.number);

      console.log(`   ✅ Created: ${ticket.number}\n`);

      // Small delay to simulate real-world usage
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('\n📊 Test Results:');
    console.log(`   Total tickets created: ${tickets.length}`);
    console.log(`   Unique ticket numbers: ${ticketNumbers.size}`);

    if (tickets.length === ticketNumbers.size) {
      console.log('   ✅ SUCCESS: All ticket numbers are unique!\n');
    } else {
      console.log('   ❌ FAILURE: Duplicate ticket numbers detected!\n');
    }

    console.log('Created ticket numbers:');
    tickets.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.number}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTicketCreation();
