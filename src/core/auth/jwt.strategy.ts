import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';

export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Reads JWT from HTTP-only cookie first, then falls back to Bearer header.
 * The validated payload is attached to request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. HTTP-only cookie (web app)
        (req: Request) => req?.cookies?.['access_token'] ?? null,
        // 2. Authorization: Bearer (mobile / API clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.role === 'CUSTOMER') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          tenantId: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!customer) {
        throw new UnauthorizedException('Customer not found');
      }

      return {
        id: customer.id,
        tenantId: customer.tenantId,
        role: 'CUSTOMER',
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isActive: true,
      };
    }

    const userId = payload.sub || (payload as any).id;
    const userEmail = (payload as any).email;
    let tenantId = payload.tenantId;

    if (!tenantId && (payload as any).slug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: (payload as any).slug },
      });
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    if (!userId && (!userEmail || !tenantId)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findFirst({
      where: userId ? { id: userId } : { tenantId, email: userEmail },
      select: {
        id: true,
        tenantId: true,
        role: true,
        isActive: true,
        name: true,
        outletId: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user; // attached to req.user
  }
}
