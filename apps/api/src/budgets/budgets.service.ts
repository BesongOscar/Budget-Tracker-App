import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetStatus } from '@prisma/client';
import { getMonthRange } from '../common/utils/date.utils';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async recalculateSpent(
    userId: string,
    categoryId: string,
    periodMonth: string,
  ) {
    const { start, end } = getMonthRange(periodMonth);

    const result = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
      },
    });

    const totalSpent = Number(result._sum.amount ?? 0);

    const budget = await this.prisma.budget.findUnique({
      where: {
        userId_categoryId_periodMonth: {
          userId,
          categoryId,
          periodMonth,
        },
      },
    });

    if (!budget) {
      return null;
    }

    const allocated = Number(budget.allocatedAmount);
    let newStatus = budget.status;

    if (budget.status === BudgetStatus.DRAFT && totalSpent > 0) {
      newStatus = BudgetStatus.ACTIVE;
    } else if (budget.status === BudgetStatus.ACTIVE && totalSpent === 0) {
      newStatus = BudgetStatus.DRAFT;
    } else if (budget.status === BudgetStatus.ACTIVE && totalSpent >= allocated) {
      newStatus = BudgetStatus.OVER_BUDGET;
    } else if (budget.status === BudgetStatus.OVER_BUDGET && totalSpent < allocated) {
      newStatus = BudgetStatus.ACTIVE;
    }

    return this.prisma.budget.update({
      where: { id: budget.id },
      data: { spentAmount: totalSpent, status: newStatus },
    });
  }

  async getBudgetForPeriod(
    userId: string,
    categoryId: string,
    periodMonth: string,
  ) {
    return this.prisma.budget.findUnique({
      where: {
        userId_categoryId_periodMonth: {
          userId,
          categoryId,
          periodMonth,
        },
      },
    });
  }
}
