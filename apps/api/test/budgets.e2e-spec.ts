import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApp, closeE2eApp, E2eApp } from './create-app';
import { resetDb } from './db';

describe('Budgets (e2e)', () => {
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
        email: `budget${counter}@test.com`,
        password: 'Password123',
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

  describe('income category rejection', () => {
    it('rejects creating a budget for an income category (422)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: incomeCategoryId, allocatedAmount: 1000 })
        .expect(422);

      expect(res.body.error.status).toBe(422);
      expect(res.body.error.message).toContain('income category');
    });
  });

  describe('create', () => {
    it('creates a budget with DRAFT status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: expenseCategoryId, allocatedAmount: 500 })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      expect(Number(res.body.data.allocatedAmount)).toBe(500);
    });

    it('rejects duplicate budgets for the same category + period (409)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: expenseCategoryId, allocatedAmount: 500 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: expenseCategoryId, allocatedAmount: 800 })
        .expect(409);

      expect(res.body.error.status).toBe(409);
    });
  });

  describe('copy-period', () => {
    it('copies source-month budgets to the target month with spent 0 and DRAFT status', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: expenseCategoryId, allocatedAmount: 400, periodMonth: '2026-01' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: expenseCategoryId, allocatedAmount: 250, periodMonth: '2026-01' })
        .expect(409);

      const copy = await request(app.getHttpServer())
        .post('/api/v1/budgets/copy-period')
        .set(auth())
        .send({ fromMonth: '2026-01', toMonth: '2026-02' })
        .expect(201);

      expect(copy.body.data.copied).toBe(1);

      const target = await request(app.getHttpServer())
        .get('/api/v1/budgets?month=2026-02')
        .set(auth())
        .expect(200);

      expect(target.body.data.budgets).toHaveLength(1);
      expect(Number(target.body.data.budgets[0].allocatedAmount)).toBe(400);
      expect(Number(target.body.data.budgets[0].spentAmount)).toBe(0);
      expect(target.body.data.budgets[0].status).toBe('DRAFT');
    });

    it('is idempotent: re-copying preserves existing target budgets without duplicates', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/budgets')
        .set(auth())
        .send({ categoryId: expenseCategoryId, allocatedAmount: 300, periodMonth: '2026-03' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/budgets/copy-period')
        .set(auth())
        .send({ fromMonth: '2026-03', toMonth: '2026-04' })
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/api/v1/budgets/copy-period')
        .set(auth())
        .send({ fromMonth: '2026-03', toMonth: '2026-04' })
        .expect(201);

      expect(second.body.data.copied).toBe(1);

      const target = await request(app.getHttpServer())
        .get('/api/v1/budgets?month=2026-04')
        .set(auth())
        .expect(200);
      expect(target.body.data.budgets).toHaveLength(1);
    });

    it('rejects identical source and target months (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/budgets/copy-period')
        .set(auth())
        .send({ fromMonth: '2026-05', toMonth: '2026-05' })
        .expect(400);

      expect(res.body.error.status).toBe(400);
    });
  });
});