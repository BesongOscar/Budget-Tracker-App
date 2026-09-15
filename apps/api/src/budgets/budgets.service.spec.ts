import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BudgetStatus, TransactionType } from '@prisma/client';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BudgetsService', () => {
  let service: BudgetsService;

  const prisma = {
    transaction: { aggregate: jest.fn() },
    budget: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      upsert: jest.fn(),
    },
    budgetPeriod: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const notifications = {
    notifyOverAllocation: jest.fn(),
    notifyBudgetEvents: jest.fn(),
  };

  const userId = 'user-1';
  const catId = 'cat-exp';
  const month = '2026-09';

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = moduleRef.get(BudgetsService);
  });

  function setExpenseAggregate(sum: number) {
    prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: sum } });
  }

  function setIncomeAndAllocated(income: number, allocated: number) {
    prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: income } });
    prisma.budget.aggregate.mockResolvedValue({ _sum: { allocatedAmount: allocated } });
  }

  describe('recalculateSpent', () => {
    it('aggregates only EXPENSE transactions for the user/category within the period', async () => {
      setExpenseAggregate(100);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 500, spentAmount: 0, status: 'DRAFT',
      });
      prisma.budget.update.mockImplementation(async (args: { data: any }) => ({
        id: 'b1', spentAmount: args.data.spentAmount ?? 100,
        status: args.data.status ?? 'ACTIVE',
        allocatedAmount: 500,
        category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);

      const aggWhere = prisma.transaction.aggregate.mock.calls[0][0].where;
      expect(aggWhere.userId).toBe(userId);
      expect(aggWhere.categoryId).toBe(catId);
      expect(aggWhere.type).toBe(TransactionType.EXPENSE);
      expect(aggWhere.date).toHaveProperty('gte');
      expect(aggWhere.date).toHaveProperty('lte');
      expect(result.events).toEqual([]);
    });

    it('returns { budget: null, events: [] } when no budget exists', async () => {
      setExpenseAggregate(50);
      prisma.budget.findUnique.mockResolvedValue(null);

      const result = await service.recalculateSpent(userId, catId, month);

      expect(result).toEqual({ budget: null, events: [] });
      expect(prisma.budget.update).not.toHaveBeenCalled();
    });

    it('keeps DRAFT when spend is 0', async () => {
      setExpenseAggregate(0);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 500, spentAmount: 0, status: 'DRAFT',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 0, status: 'DRAFT',
        allocatedAmount: 500, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);
      expect(result.budget!.status).toBe('DRAFT');
    });

    it('transitions to ACTIVE when spend > 0 and under allocation', async () => {
      setExpenseAggregate(400);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 1000, spentAmount: 0, status: 'DRAFT',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 400, status: 'ACTIVE',
        allocatedAmount: 1000, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);
      expect(result.budget!.status).toBe('ACTIVE');
    });

    it('transitions to OVER_BUDGET when spend exceeds allocation', async () => {
      setExpenseAggregate(1200);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 1000, spentAmount: 0, status: 'ACTIVE',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 1200, status: 'OVER_BUDGET',
        allocatedAmount: 1000, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);
      expect(result.budget!.status).toBe('OVER_BUDGET');
    });

    it('transitions to COMPLETED when period has ended and spend > 0', async () => {
      setExpenseAggregate(300);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 1000, spentAmount: 0, status: 'ACTIVE',
        periodMonth: '2026-07',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 300, status: 'COMPLETED',
        allocatedAmount: 1000, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, '2026-07');
      expect(result.budget!.status).toBe('COMPLETED');
    });

    it('keeps ARCHIVED as a terminal status', async () => {
      setExpenseAggregate(500);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 1000, spentAmount: 0, status: 'ARCHIVED',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 500, status: 'ARCHIVED',
        allocatedAmount: 1000, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);
      expect(result.budget!.status).toBe('ARCHIVED');
    });

    it('fires THRESHOLD_80 when spend crosses 80%', async () => {
      setExpenseAggregate(4800);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 6000, spentAmount: 0, status: 'DRAFT',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 4800, status: 'ACTIVE',
        allocatedAmount: 6000, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);
      expect(result.events).toEqual(['THRESHOLD_80']);
    });

    it('fires both THRESHOLD_80 and OVER_BUDGET when spend jumps past 100%', async () => {
      setExpenseAggregate(7000);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 6000, spentAmount: 0, status: 'DRAFT',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 7000, status: 'OVER_BUDGET',
        allocatedAmount: 6000, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);
      expect(result.events).toEqual(['THRESHOLD_80', 'OVER_BUDGET']);
    });

    it('does not re-fire events when the boundary was already crossed', async () => {
      setExpenseAggregate(5200);
      prisma.budget.findUnique.mockResolvedValue({
        id: 'b1', allocatedAmount: 6000, spentAmount: 4900, status: 'ACTIVE',
      });
      prisma.budget.update.mockImplementation(async () => ({
        id: 'b1', spentAmount: 5200, status: 'ACTIVE',
        allocatedAmount: 6000, category: { id: catId, name: 'Food', type: 'EXPENSE' },
      }));

      const result = await service.recalculateSpent(userId, catId, month);
      expect(result.events).toEqual([]);
    });
  });

  describe('recomputePeriod', () => {
    it('shouldWarn = true when over-allocated and not yet warned', async () => {
      setIncomeAndAllocated(5000, 6000);
      prisma.budgetPeriod.findUnique.mockResolvedValue(null);
      prisma.budgetPeriod.upsert.mockImplementation(async (args: { create: any }) => ({ ...args.create, id: 'bp1' }));

      const { shouldWarn, summary } = await service.recomputePeriod(userId, month);

      expect(summary.isOverAllocated).toBe(true);
      expect(shouldWarn).toBe(true);
    });

    it('shouldWarn = false when already warned', async () => {
      setIncomeAndAllocated(5000, 6000);
      prisma.budgetPeriod.findUnique.mockResolvedValue({
        overAllocationWarnedAt: new Date(),
      });
      prisma.budgetPeriod.upsert.mockImplementation(async (args: any) => args.create);

      const { shouldWarn } = await service.recomputePeriod(userId, month);
      expect(shouldWarn).toBe(false);
    });

    it('shouldWarn = false when not over-allocated', async () => {
      setIncomeAndAllocated(10000, 5000);
      prisma.budgetPeriod.findUnique.mockResolvedValue(null);
      prisma.budgetPeriod.upsert.mockImplementation(async (args: any) => args.create);

      const { shouldWarn } = await service.recomputePeriod(userId, month);
      expect(shouldWarn).toBe(false);
    });
  });

  describe('copyPeriod', () => {
    it('rejects when source and target months are the same', async () => {
      await expect(
        service.copyPeriod(userId, { fromMonth: '2026-08', toMonth: '2026-08' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('upserts target budgets with spentAmount 0 and DRAFT status', async () => {
      prisma.budget.findMany.mockResolvedValue([
        {
          id: 'b1', userId, categoryId: 'exp-cat', periodMonth: '2026-08',
          allocatedAmount: 500, spentAmount: 200, status: 'ACTIVE',
        },
      ]);
      setIncomeAndAllocated(0, 0);
      prisma.budgetPeriod.findUnique.mockResolvedValue(null);
      prisma.budgetPeriod.upsert.mockImplementation(async (args: any) => args.create);

      const result = await service.copyPeriod(userId, {
        fromMonth: '2026-08',
        toMonth: '2026-09',
      });

      expect(result.copied).toBe(1);
      const upsertArgs = prisma.budget.upsert.mock.calls[0][0];
      expect(upsertArgs.where).toEqual({
        userId_categoryId_periodMonth: {
          userId,
          categoryId: 'exp-cat',
          periodMonth: '2026-09',
        },
      });
      expect(upsertArgs.create.allocatedAmount).toBe(500);
      expect(upsertArgs.create.spentAmount).toBe(0);
      expect(upsertArgs.create.status).toBe('DRAFT');
      expect(upsertArgs.update).toEqual({});
    });

    it('only fetches budgets for EXPENSE non-deleted categories', async () => {
      prisma.budget.findMany.mockResolvedValue([]);
      setIncomeAndAllocated(0, 0);
      prisma.budgetPeriod.findUnique.mockResolvedValue(null);
      prisma.budgetPeriod.upsert.mockResolvedValue({});

      await service.copyPeriod(userId, { fromMonth: '2026-08', toMonth: '2026-09' });

      const where = prisma.budget.findMany.mock.calls[0][0].where;
      expect(where.category).toEqual({ type: TransactionType.EXPENSE, deletedAt: null });
    });

    it('returns copied count of 0 when source month has no budgets', async () => {
      prisma.budget.findMany.mockResolvedValue([]);
      setIncomeAndAllocated(0, 0);
      prisma.budgetPeriod.findUnique.mockResolvedValue(null);
      prisma.budgetPeriod.upsert.mockResolvedValue({});

      const result = await service.copyPeriod(userId, {
        fromMonth: '2026-08',
        toMonth: '2026-09',
      });

      expect(result.copied).toBe(0);
    });
  });
});