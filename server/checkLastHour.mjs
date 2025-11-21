import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const comments = await prisma.comment.findMany({
    where: {
      createdAt: { gte: oneHourAgo }
    },
    include: {
      author: { select: { name: true, email: true, role: true } },
      ticket: { select: { number: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  console.log('=== Comments created in last hour ===\n');
  console.log('Total:', comments.length, '\n');
  
  if (comments.length === 0) {
    console.log('No comments in last hour');
  } else {
    comments.forEach((c, idx) => {
      const timeDiff = Date.now() - c.createdAt.getTime();
      const minutesAgo = Math.floor(timeDiff / 60000);
      
      console.log('[' + (idx + 1) + '] ' + c.id);
      console.log('    "' + c.content + '"');
      console.log('    ' + (c.author.name || c.author.email) + ' (' + c.author.role + ')');
      console.log('    Ticket #' + c.ticket.number);
      console.log('    ' + minutesAgo + ' minutes ago');
      console.log('');
    });
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
