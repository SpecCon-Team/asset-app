import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const ticketId = 'cmi7f2g2g0008zoi95aqlysea';

  const comments = await prisma.comment.findMany({
    where: { ticketId },
    include: {
      author: {
        select: { name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`=== Comments on ticket ${ticketId} ===\n`);
  console.log(`Total: ${comments.length}\n`);

  comments.forEach((c, idx) => {
    console.log(`[${idx + 1}] ${c.id}`);
    console.log(`    "${c.content}"`);
    console.log(`    Author: ${c.author.name || c.author.email} (${c.author.role})`);
    console.log(`    Created: ${c.createdAt.toISOString()}`);
    console.log('');
  });

  // Check for duplicates
  const contentMap = {};
  comments.forEach(c => {
    const key = `${c.content}|${c.authorId}`;
    if (!contentMap[key]) contentMap[key] = [];
    contentMap[key].push(c);
  });

  let duplicatesFound = false;
  Object.entries(contentMap).forEach(([key, list]) => {
    if (list.length > 1) {
      duplicatesFound = true;
      console.log(`🔴 DUPLICATE: "${list[0].content}"`);
      console.log(`   Found ${list.length} times`);
      list.forEach(c => console.log(`   - ${c.id} at ${c.createdAt.toISOString()}`));
      console.log('');
    }
  });

  if (!duplicatesFound) {
    console.log('✅ No duplicates found');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
