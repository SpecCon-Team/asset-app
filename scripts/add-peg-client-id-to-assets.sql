-- Add pegClientId field to Asset table
-- This migration adds the foreign key relationship between Assets and PEGClients

-- Step 1: Add the pegClientId column (nullable)
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "pegClientId" TEXT;

-- Step 2: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Asset_pegClientId_fkey'
    ) THEN
        ALTER TABLE "Asset" ADD CONSTRAINT "Asset_pegClientId_fkey" 
        FOREIGN KEY ("pegClientId") REFERENCES "PEGClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS "Asset_pegClientId_idx" ON "Asset"("pegClientId");
