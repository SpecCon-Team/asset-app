import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const comments = await prisma.comment.findMany({
    where: {
      createdAt: {
        gte: fiveMinutesAgo
      }
    },
    include: {
      author: {
        select: { name: true, email: true, role: true }
      },
      ticket: {
        select: { number: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('=== Comments created in last 5 minutes ===\n');
  console.log('Total:', comments.length, '\n');
  
  if (comments.length === 0) {
    console.log('No comments found in the last 5 minutes');
  } else {
    comments.forEach((c, idx) => {
      console.log('[' + (idx + 1) + '] ID:', c.id);
      console.log('    Content:', c.content);
      console.log('    Author:', (c.author.name || c.author.email), '(' + c.author.role + ')');
      console.log('    Ticket:', c.ticket.number);
      console.log('    Created:', c.createdAt.toISOString());
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
