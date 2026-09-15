import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

// NOTE: this suite must boot its OWN app instance with the real throttle
// limits (5 requests / 60s). The AppModule is loaded lazily via require()
// AFTER the env vars are set, because ThrottlerModule.forRoot reads the
// values at module-evaluation time. Other e2e suites (create-app.ts)
// bootstrap with a high throttle override instead.
describe('Auth login rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.THROTTLE_LIMIT = '5';
    process.env.THROTTLE_TTL = '60000';

    const { Test } = await import('@nestjs/testing');
    const { AppModule } = await import('../src/app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows 5 login attempts per minute and rejects the 6th with 429', async () => {
    const attempts = Array.from({ length: 6 }, () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'Password123' }),
    );

    const results = await Promise.all(attempts);

    const allowed = results.filter((r) => r.status === HttpStatus.UNAUTHORIZED);
    const throttled = results.filter((r) => r.status === HttpStatus.TOO_MANY_REQUESTS);

    expect(allowed).toHaveLength(5);
    expect(throttled).toHaveLength(1);
    expect(throttled[0].body.error.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(throttled[0].body.error.code).toBeDefined();
  });
});