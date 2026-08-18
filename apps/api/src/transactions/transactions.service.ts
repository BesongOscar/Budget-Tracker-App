import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CategoriesService } from "../categories/categories.service";
import { BudgetsService, type BudgetEvent } from "../budgets/budgets.service";
import { NotificationsService } from "../notifications/notifications.service";
import { getPeriodMonth, getMonthRange } from "../common/utils/date.utils";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";

interface BudgetEventContext {
  events: BudgetEvent[];
  budget: any;
}

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly budgetsService: BudgetsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(userId: string, query: QueryTransactionsDto) {
    const { type, categoryId, from, to, page = 1, limit = 20 } = query;

    const where: any = { userId };

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [data] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return data;
  }

  async findOne(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { category: true },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    return transaction;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (category.type !== dto.type) {
      throw new UnprocessableEntityException(
        `Category type '${category.type}' does not match transaction type '${dto.type}'`,
      );
    }

    const transactionDate = new Date(dto.date);
    const periodMonth = getPeriodMonth(transactionDate);

    const pendingEvents: BudgetEventContext[] = [];

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: dto.type,
          categoryId: dto.categoryId,
          date: transactionDate,
          description: dto.description,
          userId,
        },
        include: { category: true },
      });

      if (dto.type === "EXPENSE") {
        const result = await this.budgetsService.recalculateSpent(
          userId,
          dto.categoryId,
          periodMonth,
          tx,
        );
        if (result.events.length > 0) {
          pendingEvents.push({ events: result.events, budget: result.budget });
        }
      }

      return created;
    });

    await this.dispatchBudgetEvents(userId, pendingEvents);

    return transaction;
  }

  async update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!existing) {
      throw new NotFoundException("Transaction not found");
    }

    const newCategoryId = dto.categoryId ?? existing.categoryId;
    const newType = dto.type ?? existing.type;

    if (dto.categoryId || dto.type) {
      const category = await this.prisma.category.findFirst({
        where: { id: newCategoryId, userId, deletedAt: null },
      });

      if (!category) {
        throw new NotFoundException("Category not found");
      }

      if (category.type !== newType) {
        throw new UnprocessableEntityException(
          `Category type '${category.type}' does not match transaction type '${newType}'`,
        );
      }
    }

    const newDate = dto.date ? new Date(dto.date) : existing.date;
    const oldPeriodMonth = getPeriodMonth(existing.date);
    const newPeriodMonth = getPeriodMonth(newDate);
    const wasExpense = existing.type === "EXPENSE";
    const isExpense = newType === "EXPENSE";

    const pendingEvents: BudgetEventContext[] = [];

    const transaction = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.date !== undefined && { date: newDate }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
        },
        include: { category: true },
      });

      if (wasExpense) {
        const result = await this.budgetsService.recalculateSpent(
          userId,
          existing.categoryId,
          oldPeriodMonth,
          tx,
        );
        if (result.events.length > 0) {
          pendingEvents.push({ events: result.events, budget: result.budget });
        }
      }

      if (
        isExpense &&
        (newCategoryId !== existing.categoryId ||
          newPeriodMonth !== oldPeriodMonth)
      ) {
        const result = await this.budgetsService.recalculateSpent(
          userId,
          newCategoryId,
          newPeriodMonth,
          tx,
        );
        if (result.events.length > 0) {
          pendingEvents.push({ events: result.events, budget: result.budget });
        }
      }

      return updated;
    });

    await this.dispatchBudgetEvents(userId, pendingEvents);

    return transaction;
  }

  async remove(userId: string, transactionId: string) {
    const existing = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!existing) {
      throw new NotFoundException("Transaction not found");
    }

    const periodMonth = getPeriodMonth(existing.date);
    const wasExpense = existing.type === "EXPENSE";

    const pendingEvents: BudgetEventContext[] = [];

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id: transactionId } });

      if (wasExpense) {
        const result = await this.budgetsService.recalculateSpent(
          userId,
          existing.categoryId,
          periodMonth,
          tx,
        );
        if (result.events.length > 0) {
          pendingEvents.push({ events: result.events, budget: result.budget });
        }
      }
    });

    await this.dispatchBudgetEvents(userId, pendingEvents);

    return { message: "Transaction deleted" };
  }

  private async dispatchBudgetEvents(
    userId: string,
    results: BudgetEventContext[],
  ): Promise<void> {
    for (const { events, budget } of results) {
      await this.notificationsService.notifyBudgetEvents(
        userId,
        events,
        budget,
      );
    }
  }
}
