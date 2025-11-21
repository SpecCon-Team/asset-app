import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function testDuplicatePrevention() {
  console.log('=== Testing Comment Duplicate Prevention ===\n');

  try {
    // Find a test ticket and user
    const ticket = await prisma.ticket.findFirst({
      where: { status: { not: 'CLOSED' } },
    });

    const user = await prisma.user.findFirst({
      where: { role: 'TECHNICIAN' },
    });

    if (!ticket || !user) {
      console.log('❌ No test ticket or technician user found');
      return;
    }

    console.log(`✅ Using Ticket: ${ticket.number}`);
    console.log(`✅ Using User: ${user.name || user.email}\n`);

    const testContent = `Test comment for duplicate prevention - ${Date.now()}`;
    const contentHash = crypto
      .createHash('md5')
      .update(testContent + ticket.id + user.id)
      .digest('hex');

    console.log(`📝 Test content: "${testContent}"`);
    console.log(`🔑 Content hash: ${contentHash}\n`);

    // Try to create the comment twice
    console.log('Attempt 1: Creating comment...');
    const comment1 = await prisma.comment.create({
      data: {
        content: testContent,
        ticketId: ticket.id,
        authorId: user.id,
        contentHash,
      },
    });
    console.log(`✅ Comment 1 created - ID: ${comment1.id}\n`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    // Try to create the same comment again
    console.log('Attempt 2: Trying to create duplicate comment...');
    try {
      const comment2 = await prisma.comment.create({
        data: {
          content: testContent,
          ticketId: ticket.id,
          authorId: user.id,
          contentHash,
        },
      });
      console.log(`❌ PROBLEM: Comment 2 created - ID: ${comment2.id}`);
      console.log('⚠️  Duplicate prevention is NOT working properly!\n');

      // Clean up both comments
      await prisma.comment.deleteMany({
        where: { id: { in: [comment1.id, comment2.id] } },
      });
    } catch (error) {
      // Check if the duplicate detection caught it
      const recentTime = new Date(Date.now() - 30000);
      const existingComment = await prisma.comment.findFirst({
        where: {
          content: testContent,
          ticketId: ticket.id,
          authorId: user.id,
          createdAt: { gte: recentTime },
        },
      });

      if (existingComment) {
        console.log(`✅ Duplicate prevented! Found existing comment: ${existingComment.id}`);
        console.log('✅ System correctly prevented duplicate comment creation\n');
      } else {
        console.log(`❌ Error occurred but no duplicate found: ${error.message}\n`);
      }

      // Clean up the test comment
      if (comment1) {
        await prisma.comment.delete({ where: { id: comment1.id } });
        console.log('🧹 Test comment cleaned up');
      }
    }

    // Check for any remaining duplicates
    console.log('\n📊 Checking for duplicates in database...');
    const duplicates = await prisma.$queryRaw`
      SELECT
        content,
        "ticketId",
        "authorId",
        COUNT(*) as count
      FROM "Comment"
      GROUP BY content, "ticketId", "authorId"
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found in database!');
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate groups:`);
      console.log(duplicates);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDuplicatePrevention().catch(console.error);
