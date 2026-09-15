import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { EmailModule } from "./email/email.module";
import { CategoriesModule } from "./categories/categories.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { UsersModule } from "./users/users.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

const THROTTLE_LIMIT = parseInt(process.env.THROTTLE_LIMIT ?? '5', 10);
const THROTTLE_TTL = parseInt(process.env.THROTTLE_TTL ?? '60000', 10);

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ limit: THROTTLE_LIMIT, ttl: THROTTLE_TTL }] }),
    PrismaModule,
    AuthModule,
    EmailModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    NotificationsModule,
    UsersModule,
    AnalyticsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
