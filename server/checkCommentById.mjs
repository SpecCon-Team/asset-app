import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkComment() {
  const commentId = 'cmi7gcd8g0001wv0f7xvs50ln';

  console.log('=== Checking Comment ===\n');

  const comments = await prisma.comment.findMany({
    where: {
      id: commentId
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  console.log('Found', comments.length, 'comment(s) with ID:', commentId);

  if (comments.length > 0) {
    comments.forEach((c, idx) => {
      console.log(`\n[${idx + 1}]`, c.content);
      console.log('    Author:', c.author.name || c.author.email);
      console.log('    Created:', c.createdAt);
    });
  }

  // Check for duplicates by content on this ticket
  const ticketId = 'cmi7f2g2g0008zoi95aqlysea';
  console.log('\n=== Checking all comments on ticket ===\n');

  const allComments = await prisma.comment.findMany({
    where: {
      ticketId: ticketId
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('Total comments on ticket:', allComments.length);
  allComments.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] ID: ${c.id}`);
    console.log('    Content:', c.content);
    console.log('    Author:', c.author.name || c.author.email, `(${c.author.role})`);
    console.log('    Created:', c.createdAt);
  });

  await prisma.$disconnect();
}

checkComment().catch(console.error);
