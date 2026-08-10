import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappProcessor } from './whatsapp.processor';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { WhatsappSessionManager } from './whatsapp-session.manager';
import { DatabaseModule } from '../../core/database/database.module';

/**
 * WhatsappModule handles background job processing and API CRM routes for WhatsApp.
 */
@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({ name: 'whatsapp-queue' }),
  ],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [WhatsappService, WhatsappProcessor, WhatsappSessionManager],
  exports: [WhatsappService, WhatsappProcessor, WhatsappSessionManager],
})
export class WhatsappModule {}
