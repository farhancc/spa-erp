import { Module } from '@nestjs/common';
import { GiftCardController } from './gift-card.controller';
import { GiftCardService } from './gift-card.service';

@Module({
  controllers: [GiftCardController],
  providers: [GiftCardService],
  exports: [GiftCardService],
})
export class GiftCardModule {}
