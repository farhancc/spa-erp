import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { Public } from '../../core/auth/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RequiresFeature } from '../../core/permissions/features.decorator';

@ApiTags('Loyalty')
@RequiresFeature('loyaltyEnabled')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Public()
  @Get('program')
  async getProgram() {
    return this.loyaltyService.getOrCreateProgram();
  }

  @Public()
  @Patch('program')
  async updateProgram(@Body() dto: any) {
    return this.loyaltyService.updateProgram(dto);
  }

  @Public()
  @Get('account/:customerId')
  async getAccount(@Param('customerId') customerId: string) {
    return this.loyaltyService.getOrCreateAccount(customerId);
  }

  @Public()
  @Post('account/:customerId/adjust')
  async adjustPoints(
    @Param('customerId') customerId: string,
    @Body() dto: { points: number; description?: string },
  ) {
    return this.loyaltyService.adjustPoints(customerId, dto.points, dto.description);
  }
}
