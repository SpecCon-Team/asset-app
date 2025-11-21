import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('=== Cleaning Up Duplicate Comments ===\n');

  const allComments = await prisma.comment.findMany({
    orderBy: {
      createdAt: 'asc'
    }
  });

  const grouped = {};

  allComments.forEach(comment => {
    const key = `${comment.authorId}-${comment.ticketId}-${comment.content}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(comment);
  });

  let deletedCount = 0;

  for (const [key, comments] of Object.entries(grouped)) {
    if (comments.length > 1) {
      console.log(`🔧 Found ${comments.length} duplicates`);
      console.log(`   Keeping: ${comments[0].id}`);

      for (let i = 1; i < comments.length; i++) {
        console.log(`   Deleting: ${comments[i].id}`);
        await prisma.comment.delete({
          where: { id: comments[i].id }
        });
        deletedCount++;
      }
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} duplicate comments`);

  await prisma.$disconnect();
}

cleanupDuplicates().catch(console.error);
