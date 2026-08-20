import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BudgetStatus, Prisma, TransactionType } from "@prisma/client";
import { getMonthRange, getPeriodMonth } from "../common/utils/date.utils";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";
import { CopyPeriodDto } from "./dto/copy-period.dto";
import { NotificationsService } from "../notifications/notifications.service";

export type BudgetEvent = "THRESHOLD_80" | "OVER_BUDGET";

export interface RecalculateResult {
  budget: any | null;
  events: BudgetEvent[];
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async recalculateSpent(
    userId: string,
    categoryId: string,
    periodMonth: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecalculateResult> {
    const client = tx ?? this.prisma;
    const { start, end } = getMonthRange(periodMonth);

    const result = await client.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        categoryId,
        type: TransactionType.EXPENSE,
        date: { gte: start, lte: end },
      },
    });

    const totalSpent = Number(result._sum.amount ?? 0);

    const budget = await client.budget.findUnique({
      where: {
        userId_categoryId_periodMonth: {
          userId,
          categoryId,
          periodMonth,
        },
      },
    });

    if (!budget) {
      return { budget: null, events: [] };
    }

    const allocated = Number(budget.allocatedAmount);
    const oldSpent = Number(budget.spentAmount);
    const events: BudgetEvent[] = [];

    if (allocated > 0) {
      if (oldSpent < allocated * 0.8 && totalSpent >= allocated * 0.8) {
        events.push("THRESHOLD_80");
      }
      if (oldSpent < allocated && totalSpent >= allocated) {
        events.push("OVER_BUDGET");
      }
    }

    const periodEnded = end.getTime() < Date.now();

    let newStatus = budget.status;
    if (budget.status === BudgetStatus.ARCHIVED) {
      newStatus = BudgetStatus.ARCHIVED;
    } else if (totalSpent === 0) {
      newStatus = BudgetStatus.DRAFT;
    } else if (allocated > 0 && totalSpent > allocated) {
      newStatus = BudgetStatus.OVER_BUDGET;
    } else if (periodEnded) {
      newStatus = BudgetStatus.COMPLETED;
    } else {
      newStatus = BudgetStatus.ACTIVE;
    }

    const updated = await client.budget.update({
      where: { id: budget.id },
      data: { spentAmount: totalSpent, status: newStatus },
      include: { category: true },
    });

    return { budget: updated, events };
  }

  async findOne(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { category: true },
    });

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    return budget;
  }

  async findAll(
    userId: string,
    periodMonth: string,
    status?: BudgetStatus,
    categoryId?: string,
  ) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        periodMonth,
        ...(status && { status }),
        ...(categoryId && { categoryId }),
        category: { type: TransactionType.EXPENSE, deletedAt: null },
      },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    });

    const summary = await this.computeSummary(userId, periodMonth);

    return { budgets, summary };
  }

  async create(userId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (category.type !== TransactionType.EXPENSE) {
      throw new UnprocessableEntityException(
        `Cannot create a budget for income category '${category.name}'. Budgets can only be created for expense categories.`,
      );
    }

    const periodMonth = dto.periodMonth ?? getPeriodMonth(new Date());

    const existing = await this.prisma.budget.findUnique({
      where: {
        userId_categoryId_periodMonth: {
          userId,
          categoryId: dto.categoryId,
          periodMonth,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        "A budget already exists for this category and period",
      );
    }

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        periodMonth,
        allocatedAmount: dto.allocatedAmount ?? 0,
        status: BudgetStatus.DRAFT,
      },
      include: { category: true },
    });

    const { summary, shouldWarn } = await this.recomputePeriod(
      userId,
      periodMonth,
    );

    if (shouldWarn) {
      await this.notificationsService.notifyOverAllocation(
        userId,
        periodMonth,
        summary,
      );
    }

    return budget;
  }

  async update(userId: string, budgetId: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { allocatedAmount: dto.allocatedAmount },
    });

    const { budget: recalced, events } = await this.recalculateSpent(
      userId,
      budget.categoryId,
      budget.periodMonth,
    );

    if (events.length > 0) {
      await this.notificationsService.notifyBudgetEvents(
        userId,
        events,
        recalced,
      );
    }

    const { summary, shouldWarn } = await this.recomputePeriod(
      userId,
      budget.periodMonth,
    );

    if (shouldWarn) {
      await this.notificationsService.notifyOverAllocation(
        userId,
        budget.periodMonth,
        summary,
      );
    }

    return recalced;
  }

  async remove(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    if (
      budget.status !== BudgetStatus.DRAFT &&
      budget.status !== BudgetStatus.ARCHIVED
    ) {
      throw new ConflictException(
        `Cannot delete a budget with status '${budget.status}'. Only Draft or Archived budgets can be deleted.`,
      );
    }

    await this.prisma.budget.delete({ where: { id: budgetId } });

    const { summary, shouldWarn } = await this.recomputePeriod(
      userId,
      budget.periodMonth,
    );

    if (shouldWarn) {
      await this.notificationsService.notifyOverAllocation(
        userId,
        budget.periodMonth,
        summary,
      );
    }

    return { message: "Budget deleted" };
  }

  async copyPeriod(userId: string, dto: CopyPeriodDto) {
    if (dto.fromMonth === dto.toMonth) {
      throw new BadRequestException("Source and target months must differ");
    }

    const sourceBudgets = await this.prisma.budget.findMany({
      where: {
        userId,
        periodMonth: dto.fromMonth,
        category: { type: TransactionType.EXPENSE, deletedAt: null },
      },
    });

    let copied = 0;
    for (const source of sourceBudgets) {
      await this.prisma.budget.upsert({
        where: {
          userId_categoryId_periodMonth: {
            userId,
            categoryId: source.categoryId,
            periodMonth: dto.toMonth,
          },
        },
        create: {
          userId,
          categoryId: source.categoryId,
          periodMonth: dto.toMonth,
          allocatedAmount: source.allocatedAmount,
          spentAmount: 0,
          status: BudgetStatus.DRAFT,
        },
        update: {},
      });
      copied += 1;
    }

    const { summary, shouldWarn } = await this.recomputePeriod(
      userId,
      dto.toMonth,
    );

    if (shouldWarn) {
      await this.notificationsService.notifyOverAllocation(
        userId,
        dto.toMonth,
        summary,
      );
    }

    return { copied };
  }

  async computeSummary(userId: string, periodMonth: string) {
    const { start, end } = getMonthRange(periodMonth);

    const [incomeAgg, allocatedAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: TransactionType.INCOME,
          date: { gte: start, lte: end },
        },
      }),
      this.prisma.budget.aggregate({
        _sum: { allocatedAmount: true },
        where: {
          userId,
          periodMonth,
          category: { type: TransactionType.EXPENSE, deletedAt: null },
        },
      }),
    ]);

    const income = Number(incomeAgg._sum.amount ?? 0);
    const allocated = Number(allocatedAgg._sum.allocatedAmount ?? 0);
    const remainingToAllocate = income - allocated;
    const isOverAllocated = allocated > income;

    return { income, allocated, remainingToAllocate, isOverAllocated };
  }

  async recomputePeriod(userId: string, periodMonth: string) {
    const summary = await this.computeSummary(userId, periodMonth);

    const existing = await this.prisma.budgetPeriod.findUnique({
      where: { userId_periodMonth: { userId, periodMonth } },
    });

    const alreadyWarned = !!existing?.overAllocationWarnedAt;
    const shouldWarn = summary.isOverAllocated && !alreadyWarned;

    await this.prisma.budgetPeriod.upsert({
      where: { userId_periodMonth: { userId, periodMonth } },
      create: {
        userId,
        periodMonth,
        totalIncome: summary.income,
        totalAllocated: summary.allocated,
        overAllocationWarnedAt: shouldWarn ? new Date() : null,
      },
      update: {
        totalIncome: summary.income,
        totalAllocated: summary.allocated,
        ...(shouldWarn && { overAllocationWarnedAt: new Date() }),
      },
    });

    return { summary, shouldWarn };
  }
}
