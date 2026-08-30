import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TransactionType } from "@prisma/client";
import { getMonthRange, getPeriodMonth } from "../common/utils/date.utils";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, periodMonth: string) {
    const { start, end } = getMonthRange(periodMonth);

    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: TransactionType.INCOME,
          date: { gte: start, lte: end },
        },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: { gte: start, lte: end },
        },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

    return {
      period: periodMonth,
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };
  }

  async getByCategory(userId: string, periodMonth: string) {
    const { start, end } = getMonthRange(periodMonth);

    const grouped = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      _count: true,
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lte: end },
      },
      orderBy: { _sum: { amount: "desc" } },
    });

    if (grouped.length === 0) {
      return { period: periodMonth, categories: [], grandTotal: 0 };
    }

    const categoryIds = grouped.map((g) => g.categoryId);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const grandTotal = grouped.reduce(
      (sum, g) => sum + Number(g._sum.amount ?? 0),
      0,
    );

    const result = grouped.map((g) => {
      const cat = categoryMap.get(g.categoryId);
      const totalSpent = Number(g._sum.amount ?? 0);

      return {
        categoryId: g.categoryId,
        categoryName: cat?.name ?? "Unknown",
        icon: cat?.icon ?? "📦",
        color: cat?.color ?? "#8E8E93",
        totalSpent,
        transactionCount: g._count,
        percentage:
          grandTotal > 0
            ? Math.round((totalSpent / grandTotal) * 10000) / 100
            : 0,
      };
    });

    return { period: periodMonth, categories: result, grandTotal };
  }

  async getTrend(userId: string, months: number) {
    const results: {
      periodMonth: string;
      income: number;
      expenses: number;
      netBalance: number;
    }[] = [];

    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodMonth = getPeriodMonth(d);
      const { start, end } = getMonthRange(periodMonth);

      const [incomeAgg, expenseAgg] = await Promise.all([
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            type: TransactionType.INCOME,
            date: { gte: start, lte: end },
          },
        }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            type: TransactionType.EXPENSE,
            date: { gte: start, lte: end },
          },
        }),
      ]);

      const income = Number(incomeAgg._sum.amount ?? 0);
      const expenses = Number(expenseAgg._sum.amount ?? 0);

      results.push({
        periodMonth,
        income,
        expenses,
        netBalance: income - expenses,
      });
    }

    return results;
  }
}
