import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../../core/queues/queue-names.const';
import { BookingNotificationHandler } from './handlers/booking-notification.handler';
import { LoyaltyEventHandler } from './handlers/loyalty-event.handler';
import { NotificationProcessor } from './notification.processor';
import { BirthdaySchedulerService } from './birthday-scheduler.service';
import { DatabaseModule } from '../../core/database/database.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

import { PosNotificationHandler } from './handlers/pos-notification.handler';
import { InventoryNotificationHandler } from './handlers/inventory-notification.handler';

/**
 * NotificationModule
 *
 * Owns all event handlers that translate domain events into queue jobs
 * and side-effects (e.g., loyalty point crediting).
 *
 * Adding a new notification type = add a new handler class and register here.
 * Handlers are SUBSCRIBERS only — they do not expose HTTP endpoints.
 */
@Module({
  imports: [
    DatabaseModule,
    LoyaltyModule,                                         // provides LoyaltyRepository
    BullModule.registerQueue({ name: QUEUE_NAMES.WHATSAPP }),
    BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATION }),
  ],
  providers: [
    BookingNotificationHandler,
    LoyaltyEventHandler,    // credits loyalty points on InvoicePaidEvent
    NotificationProcessor,
    BirthdaySchedulerService,
    PosNotificationHandler,
    InventoryNotificationHandler,
  ],
})
export class NotificationModule {}
