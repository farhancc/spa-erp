import { Controller, Post, Get, Body, Req, Res, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { TenantContextService } from '../tenancy/tenant-context.service';
import { CurrentUser, AuthUser } from './current-user.decorator';
import { Public } from './public.decorator';
import * as bcrypt from 'bcrypt';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

function getPhoneSearchVariants(phone: string): string[] {
  const clean = phone.replace(/[\s()-]/g, '');
  if (!clean) return [];
  
  const variants = new Set<string>();
  variants.add(phone); // original input
  variants.add(clean); // e.g. "9900112233" or "+919900112233"
  
  // If it has 10 digits
  if (clean.length === 10) {
    variants.add(`+91${clean}`); // e.g. "+919900112233"
    variants.add(`+91 ${clean.substring(0, 5)} ${clean.substring(5)}`); // e.g. "+91 99001 12233"
    variants.add(`${clean.substring(0, 5)} ${clean.substring(5)}`); // e.g. "99001 12233"
  }
  // If it starts with +91 and has 13 chars total (like "+919900112233")
  else if (clean.startsWith('+91') && clean.length === 13) {
    const tenDigits = clean.substring(3);
    variants.add(tenDigits); // e.g. "9900112233"
    variants.add(`+91 ${tenDigits.substring(0, 5)} ${tenDigits.substring(5)}`); // e.g. "+91 99001 12233"
    variants.add(`${tenDigits.substring(0, 5)} ${tenDigits.substring(5)}`); // e.g. "99001 12233"
  }
  // If it starts with 91 (no +) and has 12 chars total
  else if (clean.startsWith('91') && clean.length === 12) {
    const tenDigits = clean.substring(2);
    variants.add(tenDigits);
    variants.add(`+91${tenDigits}`);
    variants.add(`+91 ${tenDigits.substring(0, 5)} ${tenDigits.substring(5)}`);
  }
  
  return Array.from(variants);
}

class LoginDto {
  @ApiPropertyOptional({ example: 'admin@careva.in' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: 'farhansalon' })
  @IsString()
  @IsOptional()
  slug?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tenantCtx: TenantContextService,
  ) { }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, phone, password, slug } = body;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone must be provided');
    }
    if (!password) {
      throw new BadRequestException('Password must be provided');
    }

    // Resolve tenant ID
    let tenantId: string | null = null;
    try {
      tenantId = this.tenantCtx.tenantId;
    } catch {
      // Context not initialized, fallback to slug resolution below
    }

    if (!tenantId && slug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug },
      });
      if (tenant && tenant.isActive) {
        tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      throw new BadRequestException('Tenant context is missing or tenant is inactive');
    }

    // Look up user in resolved tenant scope
    const phoneVariants = phone ? getPhoneSearchVariants(phone) : [];
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        OR: [
          email ? { email } : undefined,
          ...phoneVariants.map(pv => ({ phone: pv })),
        ].filter(Boolean) as any[],
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password — always bcrypt, no fallbacks
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find tenant slug
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });
    const resolvedSlug = tenant?.slug || slug || "";

    // Generate Access & Refresh JWTs
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      slug: resolvedSlug,
      name: user.name,
      email: user.email,
      outletId: user.outletId,
    };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refreshPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });

    // Set HTTP-only access_token cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    // Set HTTP-only refresh_token cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId,
        outletId: user.outletId,
      },
    };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('customer/login')
  async customerLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, phone, password, slug } = body;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone must be provided');
    }
    if (!password) {
      throw new BadRequestException('Password must be provided');
    }

    // Resolve tenant ID
    let tenantId: string | null = null;
    try {
      tenantId = this.tenantCtx.tenantId;
    } catch {
      // Context not initialized, fallback to slug resolution below
    }

    if (!tenantId && slug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug },
      });
      if (tenant && tenant.isActive) {
        tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      throw new BadRequestException('Tenant context is missing or tenant is inactive');
    }

    // Look up customer in resolved tenant scope
    const phoneVariants = phone ? getPhoneSearchVariants(phone) : [];
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        OR: [
          email ? { email } : undefined,
          ...phoneVariants.map(pv => ({ phone: pv })),
        ].filter(Boolean) as any[],
      },
    });

    if (!customer || customer.isBlocked) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password — always bcrypt, no fallbacks
    if (!customer.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find tenant slug
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });
    const resolvedSlug = tenant?.slug || slug || "";

    // Generate JWT
    const payload = {
      sub: customer.id,
      tenantId: customer.tenantId,
      role: 'CUSTOMER',
      slug: resolvedSlug,
      name: customer.name,
      email: customer.email,
    };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refreshPayload = {
      sub: customer.id,
      tenantId: customer.tenantId,
      role: 'CUSTOMER',
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });

    // Set HTTP-only access_token cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    // Set HTTP-only refresh_token cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return {
      ok: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: 'CUSTOMER',
        tenantId: customer.tenantId,
      },
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { ok: true, message: 'Logged out successfully' };
  }

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return { ok: true, user };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    try {
      const payload = this.jwtService.verify(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      // Check if user exists and is active
      let user: any;
      if (payload.role === 'CUSTOMER') {
        user = await this.prisma.customer.findUnique({
          where: { id: payload.sub },
        });
        if (!user || user.isBlocked) {
          throw new UnauthorizedException('Customer not found or blocked');
        }
      } else {
        user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });
        if (!user || !user.isActive) {
          throw new UnauthorizedException('User not found or inactive');
        }
      }

      // Fetch tenant slug
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { slug: true },
      });
      const resolvedSlug = tenant?.slug || '';

      // Generate new tokens
      const newAccessPayload = {
        sub: user.id,
        tenantId: user.tenantId,
        role: payload.role,
        slug: resolvedSlug,
        name: user.name,
        email: user.email,
        outletId: user.outletId || undefined,
      };
      const newAccessToken = this.jwtService.sign(newAccessPayload, { expiresIn: '15m' });

      const newRefreshPayload = {
        sub: user.id,
        tenantId: user.tenantId,
        role: payload.role,
        type: 'refresh',
      };
      const newRefreshToken = this.jwtService.sign(newRefreshPayload, { expiresIn: '7d' });

      // Set cookies
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 15,
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      return {
        ok: true,
        token: newAccessToken,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
