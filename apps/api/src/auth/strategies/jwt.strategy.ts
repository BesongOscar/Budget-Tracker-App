import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET must be defined');

    super({
      // Extract JWT from Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject if token has expired
      ignoreExpiration: false,
      // Use the same secret that signed the token
      secretOrKey: secret,
    });
  }

  // Called automatically after the token is verified
  // Attaches the returned value to req.user
  async validate(payload: { sub: string; email: string }) {
    // Verify the user still exists in the database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, fullName: true, currencyCode: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return user;
  }
}