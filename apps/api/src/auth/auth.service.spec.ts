import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      createMany: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const emailService = {
    sendVerificationCode: jest.fn(),
    sendPasswordResetCode: jest.fn(),
  };

  beforeAll(() => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwtService.signAsync.mockResolvedValue('signed-access-token');
    prisma.refreshToken.create.mockImplementation((args: { data: { token: string } }) =>
      Promise.resolve({ id: 'rt1', ...args.data }),
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const baseUser = {
    id: 'user-1',
    email: 'a@b.com',
    fullName: 'Alice',
    passwordHash: 'hashed-password',
  };

  const futureExpiry = new Date(Date.now() + 60_000);
  const pastExpiry = new Date(Date.now() - 60_000);

  describe('register', () => {
    it('creates the user, seeds 6 default categories, sends a verification email, and returns sanitized user + tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(baseUser);
      prisma.category.createMany.mockResolvedValue({ count: 6 });
      prisma.verificationToken.create.mockResolvedValue({ id: 'vt1' });
      emailService.sendVerificationCode.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'a@b.com',
        password: 'Password123',
        fullName: 'Alice',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'a@b.com',
          passwordHash: 'hashed-password',
          fullName: 'Alice',
        },
      });

      const seeded = prisma.category.createMany.mock.calls[0][0].data;
      expect(seeded).toHaveLength(6);
      expect(seeded.map((c: { name: string }) => c.name)).toEqual([
        'Salary',
        'Freelance',
        'Other Income',
        'Food & Drinks',
        'Transport',
        'Shopping',
      ]);

      const tokenCall = prisma.verificationToken.create.mock.calls[0][0].data;
      expect(tokenCall.code).toMatch(/^\d{6}$/);
      expect(tokenCall.expiresAt.getTime()).toBeGreaterThan(Date.now());

      expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
        'a@b.com',
        expect.stringMatching(/^\d{6}$/),
        'Alice',
      );

      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe('a@b.com');
    });

    it('throws ConflictException when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({ email: 'a@b.com', password: 'Password123' }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns sanitized user + tokens for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      const result = await service.login({ email: 'a@b.com', password: 'Password123' });

      expect(result.accessToken).toBe('signed-access-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@b.com', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and returns a new pair', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'old-token',
        expiresAt: futureExpiry,
        user: baseUser,
      });
      prisma.refreshToken.delete.mockResolvedValue({ id: 'rt-1' });

      const result = await service.refresh('old-token');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('deletes the stored token and throws for an expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-expired',
        token: 'old-token',
        expiresAt: pastExpiry,
        user: baseUser,
      });
      prisma.refreshToken.delete.mockResolvedValue({ id: 'rt-expired' });

      await expect(service.refresh('old-token')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-expired' } });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('throws for a token that does not exist', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('missing-token')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('deletes the refresh token', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('token-to-revoke');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'token-to-revoke' },
      });
    });
  });
});