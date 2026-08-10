import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  BookingCreatedEvent,
  BookingCancelledEvent,
  InvoicePaidEvent,
  CustomerBirthdayEvent,
} from '../../../core/events/domain-events';
import { QUEUE_NAMES, WHATSAPP_JOBS } from '../../../core/queues/queue-names.const';
import { PrismaService } from '../../../core/database/prisma.service';

/**
 * BookingNotificationHandler
 *
 * Listens to domain events and dispatches notification jobs to BullMQ.
 * This is the ONLY place WhatsApp/notification is triggered for bookings.
 * BookingModule has zero knowledge this exists.
 */
@Injectable()
export class BookingNotificationHandler {
  private readonly logger = new Logger(BookingNotificationHandler.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.WHATSAPP) private readonly whatsappQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(BookingCreatedEvent.EVENT)
  async handleBookingCreated(event: BookingCreatedEvent) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: event.customerId },
        select: { phone: true, name: true },
      });

      if (!customer) return;

      await this.whatsappQueue.add(
        WHATSAPP_JOBS.SEND_BOOKING_CONFIRMATION,
        {
          tenantId: event.tenantId,
          to: customer.phone,
          bookingId: event.bookingId,
          customerName: customer.name,
          scheduledAt: event.scheduledAt,
        },
        {
          delay: 0,
          priority: 1,
        },
      );

      // Schedule reminder 24h before
      const delay24h = event.scheduledAt.getTime() - Date.now() - 24 * 60 * 60 * 1000;
      if (delay24h > 0) {
        await this.whatsappQueue.add(
          WHATSAPP_JOBS.SEND_REMINDER,
          {
            tenantId: event.tenantId,
            to: customer.phone,
            bookingId: event.bookingId,
            customerName: customer.name,
            scheduledAt: event.scheduledAt,
            timeLabel: '24 hours',
          },
          { delay: delay24h },
        );
      }

      // Schedule reminder 2h before
      const delay2h = event.scheduledAt.getTime() - Date.now() - 2 * 60 * 60 * 1000;
      if (delay2h > 0) {
        await this.whatsappQueue.add(
          WHATSAPP_JOBS.SEND_REMINDER,
          {
            tenantId: event.tenantId,
            to: customer.phone,
            bookingId: event.bookingId,
            customerName: customer.name,
            scheduledAt: event.scheduledAt,
            timeLabel: '2 hours',
          },
          { delay: delay2h },
        );
      }

      // Schedule reminder 1h before
      const delay1h = event.scheduledAt.getTime() - Date.now() - 1 * 60 * 60 * 1000;
      if (delay1h > 0) {
        await this.whatsappQueue.add(
          WHATSAPP_JOBS.SEND_REMINDER,
          {
            tenantId: event.tenantId,
            to: customer.phone,
            bookingId: event.bookingId,
            customerName: customer.name,
            scheduledAt: event.scheduledAt,
            timeLabel: '1 hour',
          },
          { delay: delay1h },
        );
      }
    } catch (err) {
      this.logger.error(`Failed to queue booking confirmation: ${err.message}`);
    }
  }

  @OnEvent(BookingCancelledEvent.EVENT)
  async handleBookingCancelled(event: BookingCancelledEvent) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: event.customerId },
        select: { phone: true, name: true },
      });

      if (!customer) return;

      await this.whatsappQueue.add(WHATSAPP_JOBS.SEND_MESSAGE, {
        tenantId: event.tenantId,
        to: customer.phone,
        body: `Hi ${customer.name}, your booking has been cancelled. ${event.reason ? `Reason: ${event.reason}` : ''}`,
      });
    } catch (err) {
      this.logger.error(`Failed to queue cancellation message: ${err.message}`);
    }
  }

  @OnEvent(InvoicePaidEvent.EVENT)
  async handleInvoicePaid(event: InvoicePaidEvent) {
    if (event.loyaltyPointsEarned <= 0) return;

    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: event.customerId },
        select: { phone: true, name: true },
      });

      if (!customer) return;

      await this.whatsappQueue.add(WHATSAPP_JOBS.SEND_MESSAGE, {
        tenantId: event.tenantId,
        to: customer.phone,
        body: `🎉 You earned ${event.loyaltyPointsEarned} loyalty points! Keep visiting us for more rewards.`,
      });
    } catch (err) {
      this.logger.error(`Failed to queue loyalty notification: ${err.message}`);
    }
  }

  @OnEvent(CustomerBirthdayEvent.EVENT)
  async handleCustomerBirthday(event: CustomerBirthdayEvent) {
    try {
      await this.whatsappQueue.add(
        WHATSAPP_JOBS.SEND_BIRTHDAY_OFFER,
        {
          tenantId: event.tenantId,
          to: event.phone,
          customerName: event.name,
        },
        { priority: 5 },
      );
    } catch (err) {
      this.logger.error(`Failed to queue birthday message: ${err.message}`);
    }
  }
}
