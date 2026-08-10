import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Core
import { DatabaseModule } from './core/database/database.module';
import { PrismaService } from './core/database/prisma.service';
import { AuthModule } from './core/auth/auth.module';
import { TenancyModule } from './core/tenancy/tenancy.module';
import { TenantContextService } from './core/tenancy/tenant-context.service';
import { QueuesModule } from './core/queues/queues.module';
import { HealthModule } from './core/health/health.module';

// Guards (global)
import { JwtAuthGuard } from './core/auth/jwt-auth.guard';
import { RolesGuard } from './core/permissions/roles.guard';
import { FeaturesGuard } from './core/permissions/features.guard';
import { TenantMiddleware } from './core/tenancy/tenant.middleware';

// Configuration
import configuration from './core/config/configuration';
import { validate } from './core/config/env.validation';

// ─── Domain Modules ──────────────────────────────────────────────────────────
// Each module is independently registered here.
// To add a new module (e.g. Inventory): import it and add to the imports array.
// ─────────────────────────────────────────────────────────────────────────────
import { TenantModule } from './modules/tenant/tenant.module';
import { OutletModule } from './modules/outlet/outlet.module';
import { UserModule } from './modules/user/user.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ServiceModule } from './modules/service/service.module';
import { ProductModule } from './modules/product/product.module';
import { BookingModule } from './modules/booking/booking.module';
import { PosModule } from './modules/pos/pos.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationModule } from './modules/notification/notification.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { CmsModule } from './modules/cms/cms.module';
import { MediaModule } from './modules/media/media.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ConsentModule } from './modules/consent/consent.module';
import { GiftCardModule } from './modules/gift-card/gift-card.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { MembershipModule } from './modules/membership/membership.module';

@Module({
  imports: [
    // ─── Framework Config ─────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),

    // ─── Internal Event Bus (domain events) ───────────────
    // wildcard: true allows namespaced events like 'booking.created'
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),

    // ─── Task Scheduling ──────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Rate Limiting ────────────────────────────────────
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 }, // 100 req/min default
    ]),

    // ─── Core Infrastructure ──────────────────────────────
    DatabaseModule,
    AuthModule,
    TenancyModule,
    QueuesModule,
    HealthModule,

    // ─── Domain Modules ───────────────────────────────────
    // Add new modules here — no other file needs to change.
    TenantModule,
    OutletModule,
    UserModule,
    CustomerModule,
    ServiceModule,
    ProductModule,
    BookingModule,
    PosModule,
    LoyaltyModule,
    CouponModule,
    ReportsModule,
    NotificationModule,
    WhatsappModule,
    CmsModule,
    MediaModule,
    AuditLogModule,
    PayrollModule,
    ConsentModule,
    GiftCardModule,
    ExpenseModule,
    MembershipModule,
  ],
  providers: [
    // ─── Global Guards (order matters) ────────────────────
    { provide: APP_GUARD, useClass: JwtAuthGuard },   // 1st: auth
    { provide: APP_GUARD, useClass: RolesGuard },     // 2nd: RBAC
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, prisma: PrismaService, tenantCtx: TenantContextService) => {
        return new FeaturesGuard(reflector, prisma, tenantCtx);
      },
      inject: [Reflector, PrismaService, TenantContextService],
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // 4th: rate limit
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Resolves tenantId from subdomain on every request
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
