import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const commentId = 'cmi7hb6x40006qwxovjitpdcm';
  
  console.log('Checking if comment was duplicated before deletion...\n');
  
  // Check if there's another comment with similar content created at the same time
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  
  const recentComments = await prisma.comment.findMany({
    where: {
      ticketId: 'cmi7f2g2g0008zoi95aqlysea',
      createdAt: { gte: fiveSecondsAgo }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Recent comments on that ticket (last 5 seconds):', recentComments.length);
  
  if (recentComments.length > 0) {
    recentComments.forEach(c => {
      console.log('  - ID:', c.id);
      console.log('    Content:', c.content);
      console.log('    Created:', c.createdAt.toISOString());
      console.log('');
    });
  }
  
  // Check all comments from last minute
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const allRecent = await prisma.comment.findMany({
    where: {
      createdAt: { gte: oneMinuteAgo }
    },
    include: {
      author: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('\nAll comments in last minute:', allRecent.length);
  allRecent.forEach(c => {
    console.log('  - ' + c.content + ' by ' + (c.author.name || c.author.email));
    console.log('    ' + c.createdAt.toISOString());
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
