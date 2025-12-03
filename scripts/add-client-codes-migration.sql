-- Add clientCode field to PEGClient table
-- This migration adds auto-generated client serial numbers (e.g., CLT-001)

-- Step 1: Add the clientCode column (nullable initially)
ALTER TABLE "PEGClient" ADD COLUMN "clientCode" TEXT;

-- Step 2: Generate client codes for existing clients
-- This will create codes like CLT-001, CLT-002, etc. based on creation order
DO $$
DECLARE
    client_record RECORD;
    counter INT := 1;
BEGIN
    FOR client_record IN 
        SELECT id FROM "PEGClient" ORDER BY "createdAt" ASC
    LOOP
        UPDATE "PEGClient" 
        SET "clientCode" = 'CLT-' || LPAD(counter::TEXT, 3, '0')
        WHERE id = client_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 3: Add unique constraint
ALTER TABLE "PEGClient" ADD CONSTRAINT "PEGClient_clientCode_key" UNIQUE ("clientCode");

-- Step 4: Create index for better query performance
CREATE INDEX "PEGClient_clientCode_idx" ON "PEGClient"("clientCode");
