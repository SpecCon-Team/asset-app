import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('=== Checking for Duplicate Comments ===\n');

  // Find comments with same content, author, and ticket
  const allComments = await prisma.comment.findMany({
    include: {
      author: {
        select: {
          name: true,
          email: true
        }
      },
      ticket: {
        select: {
          number: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  console.log(`📊 Total comments (last 50): ${allComments.length}\n`);

  // Group by content + author + ticket to find duplicates
  const grouped = {};

  allComments.forEach(comment => {
    const key = `${comment.authorId}-${comment.ticketId}-${comment.content}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(comment);
  });

  // Find groups with duplicates
  let duplicateCount = 0;

  Object.entries(grouped).forEach(([key, comments]) => {
    if (comments.length > 1) {
      duplicateCount++;
      console.log(`🔴 DUPLICATE FOUND:`);
      console.log(`   Author: ${comments[0].author.name || comments[0].author.email}`);
      console.log(`   Ticket: ${comments[0].ticket.number}`);
      console.log(`   Content: "${comments[0].content.substring(0, 50)}..."`);
      console.log(`   Count: ${comments.length} duplicates`);
      console.log(`   Created at:`);
      comments.forEach(c => {
        const timeDiff = comments.length > 1 ?
          Math.abs(new Date(c.createdAt).getTime() - new Date(comments[0].createdAt).getTime()) / 1000
          : 0;
        console.log(`      - ${c.createdAt} (ID: ${c.id}) ${timeDiff > 0 ? `[${timeDiff.toFixed(1)}s apart]` : ''}`);
      });
      console.log('');
    }
  });

  if (duplicateCount === 0) {
    console.log('✅ No duplicates found!');
  } else {
    console.log(`\n⚠️  Found ${duplicateCount} duplicate comment groups\n`);
  }

  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
