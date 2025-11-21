import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('=== Cleaning up latest duplicates ===\n');
  
  // Keep the first one, delete the second
  const toDelete = 'cmi7gwm700003dq38ngp8eomr';
  
  console.log('Deleting:', toDelete);
  
  await prisma.comment.delete({
    where: { id: toDelete }
  });
  
  console.log('✅ Deleted\n');
  
  // Verify
  const remaining = await prisma.comment.findMany({
    where: {
      ticketId: 'cmi7f2g2g0008zoi95aqlysea',
      content: 'Thanks for receiving well. Working on it. '
    }
  });
  
  console.log('Remaining:', remaining.length);
  
  await prisma.$disconnect();
}

cleanup().catch(console.error);
