-- CreateTable
CREATE TABLE "BudgetPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "totalIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAllocated" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "overAllocationWarnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetPeriod_userId_idx" ON "BudgetPeriod"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPeriod_userId_periodMonth_key" ON "BudgetPeriod"("userId", "periodMonth");

-- AddForeignKey
ALTER TABLE "BudgetPeriod" ADD CONSTRAINT "BudgetPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
