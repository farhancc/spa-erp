import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../core/database/prisma.service';
import { CustomerBirthdayEvent } from '../../core/events/domain-events';

@Injectable()
export class BirthdaySchedulerService {
  private readonly logger = new Logger(BirthdaySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkBirthdays() {
    this.logger.log('Starting daily birthday checks...');

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate(); // 1-31

    try {
      // Database-side extraction of month/day — avoids fetching all customers into memory
      const customersWithDob = await this.prisma.$queryRaw<Array<{
        id: string;
        tenantId: string;
        name: string;
        phone: string;
        dob: Date;
      }>>`
        SELECT id, "tenantId", name, phone, dob
        FROM "Customer"
        WHERE "dob" IS NOT NULL
          AND "isBlocked" = false
          AND EXTRACT(MONTH FROM "dob") = ${currentMonth}
          AND EXTRACT(DAY FROM "dob") = ${currentDay}
      `;

      let count = 0;
      for (const customer of customersWithDob) {
        this.logger.log(`Firing birthday event for customer ${customer.name} (ID: ${customer.id})`);
        this.eventEmitter.emit(
          CustomerBirthdayEvent.EVENT,
          new CustomerBirthdayEvent(
            customer.tenantId,
            customer.id,
            customer.phone,
            customer.name,
          ),
        );
        count++;
      }

      this.logger.log(`Birthday checks completed. Fired events for ${count} customers.`);
    } catch (err) {
      this.logger.error(`Error checking birthdays: ${err.message}`, err.stack);
    }
  }
}
