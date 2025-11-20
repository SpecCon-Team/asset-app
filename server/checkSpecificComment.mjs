import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const commentId = 'cmi7gpi7u000a1ynvfml0za15';
  
  console.log('Searching for comment:', commentId);
  
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: { name: true, email: true, role: true } },
      ticket: { select: { number: true } }
    }
  });
  
  if (comment) {
    console.log('\n✅ Comment found:');
    console.log('   Content:', comment.content);
    console.log('   Author:', comment.author.name || comment.author.email, '(' + comment.author.role + ')');
    console.log('   Ticket:', comment.ticket.number);
    console.log('   Created:', comment.createdAt.toISOString());
  } else {
    console.log('\n❌ Comment NOT found in database');
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
