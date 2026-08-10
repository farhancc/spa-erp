import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GiftCardService } from './gift-card.service';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';

@ApiTags('Gift Cards')
@ApiBearerAuth()
@Controller('gift-cards')
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  @Post('issue')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Issue/purchase a new gift card' })
  issueGiftCard(
    @Body() dto: {
      code?: string;
      initialValue: number;
      customerId?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      validityDays?: number;
    },
  ) {
    return this.giftCardService.issueGiftCard(dto);
  }

  @Get(':code')
  @Roles(Role.OWNER, Role.MANAGER, Role.STYLIST)
  @ApiOperation({ summary: 'Look up a gift card by unique code' })
  getGiftCard(@Param('code') code: string) {
    return this.giftCardService.getGiftCard(code);
  }

  @Post('redeem')
  @Roles(Role.OWNER, Role.MANAGER, Role.STYLIST)
  @ApiOperation({ summary: 'Manually redeem/charge value from a gift card' })
  redeemGiftCard(
    @Body() dto: { code: string; amount: number },
  ) {
    return this.giftCardService.redeemGiftCard(dto.code, dto.amount);
  }
}
