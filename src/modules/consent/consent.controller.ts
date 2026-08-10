import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';

@ApiTags('Consent Forms')
@ApiBearerAuth()
@Controller('consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post('templates')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a chemical treatment consent template' })
  createTemplate(
    @Body() dto: { serviceCategoryId?: string; title: string; content: string },
  ) {
    return this.consentService.createTemplate(dto);
  }

  @Get('templates')
  @Roles(Role.OWNER, Role.MANAGER, Role.STYLIST)
  @ApiOperation({ summary: 'Get active templates (optionally filtered by service category)' })
  @ApiQuery({ name: 'serviceCategoryId', required: false, type: String })
  getTemplates(@Query('serviceCategoryId') serviceCategoryId?: string) {
    return this.consentService.getTemplates(serviceCategoryId);
  }

  @Post('sign')
  @Roles(Role.OWNER, Role.MANAGER, Role.STYLIST)
  @ApiOperation({ summary: 'Record customer digital signature/consent' })
  signConsent(
    @Body() dto: {
      customerId: string;
      templateId: string;
      bookingId?: string;
      signatureUrl?: string;
      signatureText?: string;
      ipAddress?: string;
    },
  ) {
    return this.consentService.signConsent(dto);
  }

  @Get('history/:customerId')
  @Roles(Role.OWNER, Role.MANAGER, Role.STYLIST)
  @ApiOperation({ summary: 'Get digital consent history for a customer' })
  getCustomerConsentHistory(@Param('customerId') customerId: string) {
    return this.consentService.getCustomerConsentHistory(customerId);
  }
}
