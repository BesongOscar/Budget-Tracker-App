import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ limit: 5, ttl: 60000 }] }),
    PrismaModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
