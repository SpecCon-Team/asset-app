import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('=== Cleaning up duplicate "Report to Technician" comments ===\n');
  
  const duplicates = [
    'cmi7gcd8g0001wv0f7xvs50ln', // Keep this (created first at 13:13:26.270Z)
    'cmi7gcd9a0003wv0fyhwkw8nb'  // Delete this (created at 13:13:26.301Z)
  ];
  
  // Keep the first one, delete the second
  const toDelete = duplicates[1];
  
  console.log(`Deleting comment ${toDelete}...`);
  
  const result = await prisma.comment.delete({
    where: { id: toDelete }
  });
  
  console.log('✅ Deleted duplicate comment:', result.id);
  console.log('   Content:', result.content);
  console.log('   Created:', result.createdAt);
  
  // Verify only one remains
  const remaining = await prisma.comment.findMany({
    where: {
      ticketId: 'cmi7f2g2g0008zoi95aqlysea',
      content: 'Report to Technician'
    }
  });
  
  console.log(`\n✅ Verification: ${remaining.length} comment(s) remaining with content "Report to Technician"`);
  
  await prisma.$disconnect();
}

cleanup().catch(console.error);
