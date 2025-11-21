import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  // Check the specific comment ID from frontend
  const commentId = 'cmi7gwm5s0001dq38h1p1s019';
  
  console.log('=== Checking comment ' + commentId + ' ===\n');
  
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: { name: true, email: true, role: true } },
      ticket: { select: { id: true, number: true } }
    }
  });
  
  if (comment) {
    console.log('✅ Comment found in DB:');
    console.log('   ID:', comment.id);
    console.log('   Content:', comment.content);
    console.log('   Author:', comment.author.name || comment.author.email);
    console.log('   Ticket:', comment.ticketId);
    console.log('   Created:', comment.createdAt.toISOString());
    
    // Now check if there are duplicates on this ticket
    console.log('\n=== Checking for duplicates on ticket ' + comment.ticketId + ' ===\n');
    
    const allComments = await prisma.comment.findMany({
      where: { 
        ticketId: comment.ticketId,
        content: comment.content,
        authorId: comment.authorId
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('Found ' + allComments.length + ' comment(s) with same content from same author:\n');
    
    allComments.forEach((c, idx) => {
      console.log('[' + (idx + 1) + '] ID: ' + c.id);
      console.log('    Created: ' + c.createdAt.toISOString());
      console.log('');
    });
    
  } else {
    console.log('❌ Comment NOT found in database');
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
