/*
  Warnings:

  - You are about to drop the column `code` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Asset` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[asset_code]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `asset_code` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Asset_code_key";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "code",
DROP COLUMN "location",
DROP COLUMN "type",
ADD COLUMN     "asset_code" TEXT NOT NULL,
ADD COLUMN     "asset_type" TEXT,
ADD COLUMN     "assigned_to" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "deskphones" TEXT,
ADD COLUMN     "extension" TEXT,
ADD COLUMN     "keyboard" TEXT,
ADD COLUMN     "mouse" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "office_location" TEXT,
ADD COLUMN     "ownership" TEXT,
ADD COLUMN     "scan_datetime" TEXT,
ADD COLUMN     "scanned_by" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'available',
ALTER COLUMN "condition" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_asset_code_key" ON "Asset"("asset_code");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
