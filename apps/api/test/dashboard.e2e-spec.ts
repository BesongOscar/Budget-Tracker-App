import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApp, closeE2eApp, E2eApp } from './create-app';
import { resetDb } from './db';

// Known test data (task 6.7):
//   income   = 3000  (one INCOME transaction)
//   spent    = 200   (one EXPENSE transaction)
//   allocated = 2500 (one budget)
// Expected dashboard figures:
//   balance              = all-time income - all-time expenses = 3000 - 200 = 2800
//   remainingToAllocate  = period income - allocated            = 3000 - 2500 = 500
//   spent                = period expenses                      = 200
describe('Dashboard figures (e2e)', () => {
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
      .send({ email: `dash${counter}@test.com`, password: 'Password123' })
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

  it('reports the three dashboard figures correctly with known test data', async () => {
    // income 3000
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set(auth())
      .send({ amount: 3000, type: 'INCOME', categoryId: incomeCategoryId, date: today() })
      .expect(201);

    // expense 200 (spent)
    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set(auth())
      .send({ amount: 200, type: 'EXPENSE', categoryId: expenseCategoryId, date: today() })
      .expect(201);

    // allocate 2500
    const budget = await request(app.getHttpServer())
      .post('/api/v1/budgets')
      .set(auth())
      .send({ categoryId: expenseCategoryId, allocatedAmount: 2500 })
      .expect(201);
    expect(Number(budget.body.data.allocatedAmount)).toBe(2500);

    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .set(auth())
      .expect(200);

    const dashboard = res.body.data;
    expect(Number(dashboard.income)).toBe(3000);
    expect(Number(dashboard.spent)).toBe(200);
    expect(Number(dashboard.remainingToAllocate)).toBe(500);
    expect(Number(dashboard.balance)).toBe(2800);
    expect(dashboard.isOverAllocated).toBe(false);
    expect(dashboard.allocated).toBe(2500);
  });
});