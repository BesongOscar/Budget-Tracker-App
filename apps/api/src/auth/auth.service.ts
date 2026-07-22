import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';
import {ForgotPasswordDto} from "../auth/dto/forgot-password.dto";
import {ResetPasswordDto} from "../auth/dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
      },
    });

    await this.seedDefaultCategories(user.id);

    // Generate 6-digit verification code
    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.verificationToken.create({
      data: {
        code,
        userId: user.id,
        expiresAt,
      },
    });

    // Send verification email
    await this.emailService.sendVerificationCode(user.email, code, user.fullName);

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await this.generateTokens(stored.user.id, stored.user.email);
    return { user: this.sanitizeUser(stored.user), ...tokens };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }

    const token = await this.prisma.verificationToken.findUnique({
      where: { userId: user.id },
    });

    if (!token) {
      throw new UnauthorizedException('No verification code found. Please request a new one.');
    }

    if (token.expiresAt < new Date()) {
      await this.prisma.verificationToken.delete({ where: { userId: user.id } });
      throw new UnauthorizedException('Verification code has expired. Please request a new one.');
    }

    if (token.code !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.verificationToken.delete({
        where: { userId: user.id },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }

    await this.prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    });

    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.verificationToken.create({
      data: {
        code,
        userId: user.id,
        expiresAt,
      },
    });

    this.emailService.sendVerificationCode(user.email, code, user.fullName).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    return { message: 'Verification code sent' };
  }

  async forgotPassword(dto: ForgotPasswordDto){
    const user = await this.prisma.user.findUnique({where: {email: dto.email}});

    // Always return success to prevent user enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a password reset code has been sent.' };
    }

    //Delete any existing password reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({where: {userId: user.id}});

    const code = this.generateVerificationCode();  // reuses existing private method to generate a 6-digit code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.passwordResetToken.create({
      data: {
        code,
        userId: user.id,
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetCode(user.email, code, user.fullName);

    return { message: 'If an account with that email exists, a password reset code has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto){
    const user = await this.prisma.user.findUnique({where: {email: dto.email}});
    if (!user) {
      throw new UnauthorizedException('User not found');
    };

    const token = await this.prisma.passwordResetToken.findUnique({where: {userId: user.id}});
    if (!token) {
      throw new UnauthorizedException('No password reset code found. Please request a new one.');
    }

    if (token.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({where: {userId: user.id}});
      throw new UnauthorizedException('Password reset code has expired. Please request a new one.');
    }

    if (token.code !== dto.code) {
      throw new UnauthorizedException('Invalid password reset code');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {id: user.id},
        data: {passwordHash},
      }),
      this.prisma.passwordResetToken.delete({
        where: {userId: user.id},
      }),
      // Delete all refresh tokens for the user to log them out from all devices
      this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    }),
    ]);

    return { message: 'Password reset successfully' };
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(
      payload,
      {
        secret: process.env.JWT_ACCESS_SECRET as string,
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
      },
    );

    const refreshTokenValue = randomUUID();
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private async seedDefaultCategories(userId: string) {
    const defaults = [
      { name: 'Salary', icon: '💼', color: '#34C759', type: 'INCOME' },
      { name: 'Freelance', icon: '💻', color: '#007AFF', type: 'INCOME' },
      { name: 'Other Income', icon: '💰', color: '#FF9500', type: 'INCOME' },
      { name: 'Food & Drinks', icon: '🍕', color: '#FF3B30', type: 'EXPENSE' },
      { name: 'Transport', icon: '🚗', color: '#5856D6', type: 'EXPENSE' },
      { name: 'Shopping', icon: '🛍️', color: '#FF2D55', type: 'EXPENSE' },
    ];

    await this.prisma.category.createMany({
      data: defaults.map((c) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type as any,
        userId,
      })),
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
