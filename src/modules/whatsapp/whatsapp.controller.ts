import { Controller, Get, Post, Body, Delete, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { RequiresFeature } from '../../core/permissions/features.decorator';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@Controller('whatsapp')
@RequiresFeature('whatsappEnabled')
@Roles(Role.OWNER, Role.MANAGER)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @ApiOperation({ summary: 'Get WhatsApp session connection status' })
  @Get('session')
  getSession() {
    return this.whatsappService.getSession();
  }

  @ApiOperation({ summary: 'Trigger simulated QR code generation' })
  @Post('session/qr')
  generateQr() {
    return this.whatsappService.generateQrCode();
  }

  @ApiOperation({ summary: 'Connect simulated WhatsApp device' })
  @Post('session/connect')
  connectSession(@Body('phoneNumber') phoneNumber: string) {
    return this.whatsappService.connectSession(phoneNumber);
  }

  @ApiOperation({ summary: 'Disconnect WhatsApp device' })
  @Delete('session')
  disconnectSession() {
    return this.whatsappService.disconnectSession();
  }

  @ApiOperation({ summary: 'List all sent/received messages (paginated)' })
  @Get('messages')
  getMessages(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.whatsappService.getMessages({ page: pageNum, limit: limitNum });
  }

  @ApiOperation({ summary: 'Send outbound WhatsApp message (enqueues job)' })
  @Post('send')
  sendMessage(
    @Body('to') to: string,
    @Body('body') body: string,
    @Body('customerId') customerId?: string,
  ) {
    return this.whatsappService.sendMessage(to, body, customerId);
  }

  @ApiOperation({ summary: 'Send automated campaign or simulation' })
  @Post('campaign')
  triggerCampaign(
    @Body() dto: { type: string; recipientName: string; phone: string; variables: Record<string, string> },
  ) {
    return this.whatsappService.triggerCampaign(dto);
  }

  @ApiOperation({ summary: 'Configure tenant WhatsApp session details' })
  @Post('session/config')
  configureSession(
    @Body() dto: { connectionType: string; metaAccessToken?: string; metaPhoneNumberId?: string; metaBusinessAccountId?: string; metaVerifyToken?: string }
  ) {
    return this.whatsappService.configureSession(dto);
  }

  @ApiOperation({ summary: 'Get auto-reply rules' })
  @Get('rules')
  getRules() {
    return this.whatsappService.getRules();
  }

  @ApiOperation({ summary: 'Create or update auto-reply rule' })
  @Post('rules')
  saveRule(
    @Body() dto: { id?: string; triggerType: string; keywords?: string; replyText: string; isActive?: boolean }
  ) {
    return this.whatsappService.saveRule(dto);
  }

  @ApiOperation({ summary: 'Delete auto-reply rule' })
  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.whatsappService.deleteRule(id);
  }

  @ApiOperation({ summary: 'Get birthday settings for this tenant' })
  @Get('birthday-settings')
  getBirthdaySettings() {
    return this.whatsappService.getBirthdaySettings();
  }

  @ApiOperation({ summary: 'Update birthday settings for this tenant' })
  @Post('birthday-settings')
  updateBirthdaySettings(
    @Body() dto: { birthdayWishTemplate: string; birthdayCouponCode: string }
  ) {
    return this.whatsappService.updateBirthdaySettings(dto);
  }
}
