import { Controller, Get, Post, Delete, Body, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Public } from '../../core/auth/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Tenants')
@Controller('superadmin/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Get()
  async getTenants(@Query('slug') slug?: string) {
    if (slug) {
      return this.tenantService.getTenantBySlug(slug);
    }
    return this.tenantService.getTenants();
  }

  @Public()
  @Post()
  async saveTenant(@Body() body: any) {
    return this.tenantService.saveTenant(body);
  }

  @Public()
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteTenant(@Query('slug') slug: string) {
    const success = await this.tenantService.deleteTenantBySlug(slug);
    return { ok: success };
  }
}

@ApiTags('DemoBookings')
@Controller('superadmin/demo-bookings')
export class DemoBookingController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post()
  async createDemoBooking(@Body() body: any) {
    return this.tenantService.createDemoBooking(body);
  }

  @Public()
  @Get()
  async getDemoBookings() {
    return this.tenantService.getDemoBookings();
  }

  @Public()
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteDemoBooking(@Query('id') id: string) {
    const success = await this.tenantService.deleteDemoBooking(id);
    return { ok: success };
  }
}
