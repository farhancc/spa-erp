import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';

/**
 * BookingModule
 *
 * Self-contained — owns its controller, service, and repository.
 * Communicates with other modules ONLY via domain events (EventEmitter2).
 * Does NOT import PosModule, NotificationModule, etc.
 *
 * What it exports: BookingService (for any module that legitimately needs
 * to query bookings, e.g. ReportsModule).
 */
@Module({
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
