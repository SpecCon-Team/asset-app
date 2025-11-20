-- Add unique constraint to prevent duplicate comments
-- This creates a hash of content + ticketId + authorId to prevent exact duplicates

-- First, let's see if there are any existing duplicates
SELECT
    content,
    "ticketId",
    "authorId",
    COUNT(*) as count
FROM "Comment"
GROUP BY content, "ticketId", "authorId"
HAVING COUNT(*) > 1;

-- We can't add a direct unique constraint on (content, ticketId, authorId)
-- because content is TEXT which can't be in a unique index in PostgreSQL
-- Instead, we'll create a computed hash column

-- Add a hash column to store MD5 hash of content
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "contentHash" VARCHAR(32);

-- Update existing records with hash
UPDATE "Comment" SET "contentHash" = MD5(content || "ticketId" || "authorId");

-- Create partial unique index to prevent duplicates within 30 seconds
-- This allows same comment after 30 seconds but prevents immediate duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "Comment_unique_recent"
ON "Comment" ("contentHash", "ticketId", "authorId", "createdAt")
WHERE "createdAt" > NOW() - INTERVAL '30 seconds';
