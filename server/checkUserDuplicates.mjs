import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserDuplicates() {
  console.log('=== Checking User Comment Duplicates ===\n');

  const userComments = await prisma.comment.findMany({
    include: {
      author: {
        select: {
          name: true,
          email: true,
          role: true
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
    take: 100
  });

  // Group by role
  const byRole = {
    USER: [],
    TECHNICIAN: [],
    ADMIN: []
  };

  userComments.forEach(comment => {
    byRole[comment.author.role].push(comment);
  });

  console.log('📊 Comments by role:');
  console.log('   USER: ' + byRole.USER.length);
  console.log('   TECHNICIAN: ' + byRole.TECHNICIAN.length);
  console.log('   ADMIN: ' + byRole.ADMIN.length);
  console.log('');

  // Check for duplicates in each role
  for (const role of ['USER', 'TECHNICIAN', 'ADMIN']) {
    const comments = byRole[role];
    const grouped = {};

    comments.forEach(comment => {
      const key = comment.authorId + '-' + comment.ticketId + '-' + comment.content;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(comment);
    });

    let duplicateCount = 0;
    Object.entries(grouped).forEach(([key, comments]) => {
      if (comments.length > 1) {
        duplicateCount++;
        console.log('🔴 ' + role + ' DUPLICATE:');
        console.log('   Author: ' + (comments[0].author.name || comments[0].author.email));
        console.log('   Ticket: ' + comments[0].ticket.number);
        console.log('   Content: "' + comments[0].content.substring(0, 50) + '..."');
        console.log('   Count: ' + comments.length + ' duplicates');
        console.log('');
      }
    });

    if (duplicateCount === 0) {
      console.log('✅ No ' + role + ' duplicates found\n');
    } else {
      console.log('⚠️  Found ' + duplicateCount + ' ' + role + ' duplicate groups\n');
    }
  }

  await prisma.$disconnect();
}

checkUserDuplicates().catch(console.error);
