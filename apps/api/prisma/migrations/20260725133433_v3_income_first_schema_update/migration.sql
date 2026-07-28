/*
  Warnings:

  - You are about to drop the column `limitAmount` on the `Budget` table. All the data in the column will be lost.
  - Made the column `icon` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `Category` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'OVER_BUDGET', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "limitAmount",
ADD COLUMN     "allocatedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "icon" SET NOT NULL,
ALTER COLUMN "icon" SET DEFAULT '📦',
ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#8E8E93';

-- CreateIndex
CREATE INDEX "Budget_userId_periodMonth_idx" ON "Budget"("userId", "periodMonth");

-- CreateIndex
CREATE INDEX "Budget_status_idx" ON "Budget"("status");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
