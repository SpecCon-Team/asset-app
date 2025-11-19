import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateComments() {
  try {
    console.log('🧹 Starting cleanup of duplicate comments...\n');

    // Find all comments
    const allComments = await prisma.comment.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`📊 Total comments in database: ${allComments.length}`);

    // Group comments by unique key (authorId + ticketId + content)
    const grouped = new Map();

    for (const comment of allComments) {
      const key = `${comment.authorId}_${comment.ticketId}_${comment.content}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(comment);
    }

    // Find duplicates and keep only the first one
    let duplicateCount = 0;
    let deletedCount = 0;

    for (const [key, comments] of grouped.entries()) {
      if (comments.length > 1) {
        duplicateCount++;
        console.log(`\n🔍 Found ${comments.length} duplicates:`);
        console.log(`   Author: ${comments[0].author.name || comments[0].author.email}`);
        console.log(`   Content: "${comments[0].content.substring(0, 50)}${comments[0].content.length > 50 ? '...' : ''}"`);

        // Keep the first (oldest) comment, delete the rest
        const toDelete = comments.slice(1);

        for (const comment of toDelete) {
          await prisma.comment.delete({
            where: { id: comment.id }
          });
          deletedCount++;
        }

        console.log(`   ✅ Kept 1, deleted ${toDelete.length} duplicates`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Cleanup Summary:');
    console.log(`   Total comments before: ${allComments.length}`);
    console.log(`   Duplicate groups found: ${duplicateCount}`);
    console.log(`   Comments deleted: ${deletedCount}`);
    console.log(`   Comments remaining: ${allComments.length - deletedCount}`);
    console.log('='.repeat(50));

    if (deletedCount > 0) {
      console.log('\n✅ Cleanup completed successfully!');
    } else {
      console.log('\n✅ No duplicates found - database is clean!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateComments();
