import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TenantContextService } from '../tenancy/tenant-context.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthController', () => {
  let controller: AuthController;
  let prisma: any;
  let jwtService: any;

  const mockTenantCtx = {
    tenantId: 'tenant-123',
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: TenantContextService, useValue: mockTenantCtx },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'admin@careva.in',
      password: 'password123',
      slug: 'test-slug',
    };

    beforeEach(() => {
      prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-123', slug: 'test-slug', isActive: true });
    });

    it('should throw BadRequestException if neither email nor phone is provided', async () => {
      await expect(
        controller.login({ password: 'password123' } as any, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password hash does not match', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        tenantId: 'tenant-123',
        email: 'admin@careva.in',
        passwordHash: 'hashed-pwd',
        isActive: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should login user, set access_token cookie, and return token & user info when credentials are correct', async () => {
      const user = {
        id: 'user-123',
        name: 'Farhan',
        email: 'admin@careva.in',
        phone: '1234567890',
        passwordHash: 'hashed-pwd',
        role: 'ADMIN',
        tenantId: 'tenant-123',
        outletId: 'outlet-1',
        isActive: true,
      };

      prisma.user.findFirst.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await controller.login(loginDto, mockResponse);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.name).toBe('Farhan');
      expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'mock-jwt-token', expect.any(Object));
    });
  });

  describe('logout', () => {
    it('should clear access_token and refresh_token cookies', async () => {
      const result = await controller.logout(mockResponse);
      expect(result).toEqual({ ok: true, message: 'Logged out successfully' });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const mockReq = { cookies: {} } as any;
      await expect(controller.refresh(mockReq, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token type is invalid', async () => {
      const mockReq = { cookies: { refresh_token: 'invalid-token' } } as any;
      jwtService.verify.mockReturnValue({ type: 'access', role: 'ADMIN', sub: 'user-1' });

      await expect(controller.refresh(mockReq, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate access & refresh tokens if refresh token is valid', async () => {
      const mockReq = { cookies: { refresh_token: 'valid-refresh-token' } } as any;
      jwtService.verify.mockReturnValue({
        sub: 'user-123',
        tenantId: 'tenant-123',
        role: 'ADMIN',
        type: 'refresh',
      });

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        name: 'Farhan',
        email: 'admin@careva.in',
        isActive: true,
        tenantId: 'tenant-123',
      });

      prisma.tenant.findUnique.mockResolvedValue({ slug: 'test-slug' });

      const result = await controller.refresh(mockReq, mockResponse);

      expect(result).toEqual({ ok: true, token: 'mock-jwt-token' });
      expect(mockResponse.cookie).toHaveBeenCalledWith('access_token', 'mock-jwt-token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refresh_token', 'mock-jwt-token', expect.any(Object));
    });
  });
});
