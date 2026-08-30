import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionType } from "@prisma/client";
import { getMonthRange, getPeriodMonth } from "../common/utils/date.utils";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string, periodMonth: string) {
    const { start, end } = getMonthRange(periodMonth);

    const [
      incomeAgg,
      expenseAgg,
      allocatedAgg,
      allTimeIncomeAgg,
      allTimeExpenseAgg,
      budgets,
      recentTransactions,
    ] = await Promise.all([
      // Period income
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: TransactionType.INCOME,
          date: { gte: start, lte: end },
        },
      }),
      // Period expenses
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: { gte: start, lte: end },
        },
      }),
      // Period allocated (budget sums)
      this.prisma.budget.aggregate({
        _sum: { allocatedAmount: true },
        where: {
          userId,
          periodMonth,
          category: { type: TransactionType.EXPENSE, deletedAt: null },
        },
      }),
      // All-time income (no date filter)
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: TransactionType.INCOME,
        },
      }),
      // All-time expenses (no date filter)
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: TransactionType.EXPENSE,
        },
      }),
      // Budget progress for the period
      this.prisma.budget.findMany({
        where: {
          userId,
          periodMonth,
          category: { type: TransactionType.EXPENSE, deletedAt: null },
        },
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      }),
      // Recent transactions for the period
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
        include: { category: true },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    const income = Number(incomeAgg._sum.amount ?? 0);
    const spent = Number(expenseAgg._sum.amount ?? 0);
    const allocated = Number(allocatedAgg._sum.allocatedAmount ?? 0);
    const allTimeIncome = Number(allTimeIncomeAgg._sum.amount ?? 0);
    const allTimeExpenses = Number(allTimeExpenseAgg._sum.amount ?? 0);

    const balance = allTimeIncome - allTimeExpenses;
    const remainingToAllocate = income - allocated;
    const isOverAllocated = allocated > income;

    const budgetProgress = budgets.map((b) => {
      const allocatedAmt = Number(b.allocatedAmount);
      const spentAmt = Number(b.spentAmount);
      const remaining = allocatedAmt - spentAmt;
      const percentUsed =
        allocatedAmt > 0
          ? Math.min(100, Math.round((spentAmt / allocatedAmt) * 100))
          : 0;

      return {
        categoryId: b.categoryId,
        categoryName: b.category.name,
        icon: b.category.icon,
        colorHex: b.category.color,
        allocated: allocatedAmt,
        spent: spentAmt,
        remaining,
        percentUsed,
        status: b.status,
      };
    });

    return {
      period: periodMonth,
      income,
      allocated,
      spent,
      balance,
      remainingToAllocate,
      isOverAllocated,
      budgetProgress,
      recentTransactions,
    };
  }
}
