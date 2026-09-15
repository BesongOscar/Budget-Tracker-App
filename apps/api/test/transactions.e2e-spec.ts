import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApp, closeE2eApp, E2eApp } from './create-app';
import { resetDb } from './db';

describe('Transactions CRUD (e2e)', () => {
  let e2e: E2eApp;
  let app: INestApplication;
  let token: string;
  let incomeCategoryId: string;
  let expenseCategoryId: string;
  let counter = 0;

  beforeAll(async () => {
    e2e = await createE2eApp();
    app = e2e.app;
  });

  beforeEach(async () => {
    await resetDb(e2e.prisma);
    counter += 1;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `txn${counter}@test.com`,
        password: 'Password123',
        fullName: 'Txn Tester',
      })
      .expect(201);
    token = res.body.data.accessToken;

    const cats = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const categories = cats.body.data as { id: string; type: string }[];
    incomeCategoryId = categories.find((c) => c.type === 'INCOME')!.id;
    expenseCategoryId = categories.find((c) => c.type === 'EXPENSE')!.id;
  });

  afterAll(async () => {
    await closeE2eApp(e2e);
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const today = () => new Date().toISOString();

  describe('full CRUD lifecycle', () => {
    it('creates, lists, reads, updates, and deletes a transaction', async () => {
      // create
      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set(auth())
        .send({
          amount: 100,
          type: 'EXPENSE',
          categoryId: expenseCategoryId,
          date: today(),
          description: 'Lunch',
        })
        .expect(201);

      const txnId = created.body.data.id;
      expect(created.body.data.type).toBe('EXPENSE');
      expect(Number(created.body.data.amount)).toBe(100);
      expect(created.body).toHaveProperty('meta.timestamp');

      // list
      const list = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set(auth())
        .expect(200);
      expect(Array.isArray(list.body.data)).toBe(true);
      expect(list.body.data.map((t: { id: string }) => t.id)).toContain(txnId);

      // read
      const read = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${txnId}`)
        .set(auth())
        .expect(200);
      expect(read.body.data.description).toBe('Lunch');

      // update
      const updated = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${txnId}`)
        .set(auth())
        .send({ amount: 150, description: 'Dinner' })
        .expect(200);
      expect(Number(updated.body.data.amount)).toBe(150);
      expect(updated.body.data.description).toBe('Dinner');

      // delete
      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${txnId}`)
        .set(auth())
        .expect(200);

      const after = await request(app.getHttpServer())
        .get(`/api/v1/transactions/${txnId}`)
        .set(auth())
        .expect(404);
      expect(after.body.error.status).toBe(404);
    });

    it('returns 404 for a transaction owned by another user', async () => {
      const other = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: `other${counter}@test.com`,
        password: 'Password123',
      });
      const otherToken = other.body.data.accessToken;

      const otherCats = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
      const otherExpenseCategoryId = (otherCats.body.data as { id: string; type: string }[]).find(
        (c) => c.type === 'EXPENSE',
      )!.id;

      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set({ Authorization: `Bearer ${otherToken}` })
        .send({
          amount: 10,
          type: 'EXPENSE',
          categoryId: otherExpenseCategoryId,
          date: today(),
        })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/api/v1/transactions/${created.body.data.id}`)
        .set(auth())
        .expect(404);
    });
  });

  describe('type enforcement', () => {
    it('rejects creating an EXPENSE transaction on an INCOME category (422)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set(auth())
        .send({
          amount: 50,
          type: 'EXPENSE',
          categoryId: incomeCategoryId,
          date: today(),
        })
        .expect(422);

      expect(res.body.error.status).toBe(422);
      expect(res.body.error.code).toBeDefined();
      expect(res.body.error.message).toContain('does not match');
    });

    it('rejects updating a transaction to a mismatched category type (422)', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set(auth())
        .send({
          amount: 20,
          type: 'EXPENSE',
          categoryId: expenseCategoryId,
          date: today(),
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/transactions/${created.body.data.id}`)
        .set(auth())
        .send({ type: 'INCOME' })
        .expect(422);

      expect(res.body.error.status).toBe(422);
    });
  });

  describe('budget recalculation on writes', () => {
    it('recalculates spentAmount and status as expenses are added and removed', async () => {
      // allocate 1000 to the expense category
      const budget = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: expenseCategoryId, allocatedAmount: 1000 })
        .expect(201);
      const budgetId = budget.body.data.id;

      // 400 expense → ACTIVE, spent 400
      await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set(auth())
        .send({ amount: 400, type: 'EXPENSE', categoryId: expenseCategoryId, date: today() })
        .expect(201);

      let detail = await request(app.getHttpServer())
        .get(`/api/v1/budgets/${budgetId}`)
        .set(auth())
        .expect(200);
      expect(Number(detail.body.data.spentAmount)).toBe(400);
      expect(detail.body.data.status).toBe('ACTIVE');

      // +700 → OVER_BUDGET, spent 1100
      const second = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set(auth())
        .send({ amount: 700, type: 'EXPENSE', categoryId: expenseCategoryId, date: today() })
        .expect(201);
      const secondTxnId = second.body.data.id;

      detail = await request(app.getHttpServer())
        .get(`/api/v1/budgets/${budgetId}`)
        .set(auth())
        .expect(200);
      expect(Number(detail.body.data.spentAmount)).toBe(1100);
      expect(detail.body.data.status).toBe('OVER_BUDGET');

      // delete the 700 expense → back to ACTIVE, spent 400
      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${secondTxnId}`)
        .set(auth())
        .expect(200);

      detail = await request(app.getHttpServer())
        .get(`/api/v1/budgets/${budgetId}`)
        .set(auth())
        .expect(200);
      expect(Number(detail.body.data.spentAmount)).toBe(400);
      expect(detail.body.data.status).toBe('ACTIVE');
    });
  });
});