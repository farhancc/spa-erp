import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Log slow queries in dev
    if (process.env.NODE_ENV !== 'production') {
      // @ts-expect-error: prisma event typing
      this.$on('query', (e: { query: string; duration: number }) => {
        if (e.duration > 200) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Soft-delete helper: use in repositories instead of .delete()
   * Requires a `deletedAt DateTime?` field on the model.
   */
  async softDelete(model: string, id: string): Promise<void> {
    await (this as any)[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
