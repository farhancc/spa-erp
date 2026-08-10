import { Global, Module, OnApplicationBootstrap } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue-names.const';
import * as net from 'net';
import { Queue } from 'bullmq';
import { ModuleRef } from '@nestjs/core';

async function isRedisRunning(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Global queue module — registers all BullMQ queues backed by Redis.
 *
 * Redis connection is driven by environment variables:
 *   REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
 *
 * All queues declared here are available for injection throughout the app
 * via @InjectQueue('queue-name') from '@nestjs/bullmq'.
 */
@Global()
@Module({
  imports: [
    // ─── Redis Connection (shared across all queues) ──────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const host = config.get<string>('app.redis.host') ?? 'localhost';
        const port = config.get<number>('app.redis.port') ?? 6379;
        const password = config.get<string>('app.redis.password') || undefined;
        const tls = config.get<boolean>('app.redis.tls') ? {} : undefined;
        
        const isRunning = await isRedisRunning(host, port);
        if (isRunning) {
          return {
            connection: {
              host,
              port,
              password,
              tls,
              // Gracefully retry on connection loss
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
            },
          };
        } else {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`Redis connection failed at ${host}:${port}. Redis is required in non-test environments.`);
          }
          console.warn(`⚠️  Local Redis is offline at ${host}:${port}. Falling back to in-memory ioredis-mock.`);
          const RedisMock = require('ioredis-mock');
          return {
            connection: new RedisMock(),
          };
        }
      },
    }),

    // ─── Queue Registrations ─────────────────────────────────────────────
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.WHATSAPP },
      { name: QUEUE_NAMES.REPORT },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule implements OnApplicationBootstrap {
  constructor(
    @InjectQueue(QUEUE_NAMES.WHATSAPP) private readonly whatsappQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onApplicationBootstrap() {
    const host = this.configService.get<string>('app.redis.host') ?? 'localhost';
    const port = this.configService.get<number>('app.redis.port') ?? 6379;

    const isRunning = await isRedisRunning(host, port);
    if (!isRunning) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Redis connection failed at ${host}:${port}. Redis is required in non-test environments.`);
      }
      console.warn('⚠️  Redis is offline. Overriding queue.add to process jobs immediately.');

      // Mock whatsappQueue
      const originalWhatsappAdd = this.whatsappQueue.add.bind(this.whatsappQueue);
      this.whatsappQueue.add = (async (name: string, data: any, opts?: any) => {
        const jobId = `mock_job_wa_${Date.now()}`;
        const job = { id: jobId, name, data, opts } as any;

        // Respect delay but scale down big delays (like 1h, 2h, 24h) to 1-3 seconds for responsive testing
        const delay = opts?.delay || 0;
        let actualDelay = 0;
        if (delay > 0) {
          if (delay >= 24 * 60 * 60 * 1000) {
            actualDelay = 3000;
          } else if (delay >= 2 * 60 * 60 * 1000) {
            actualDelay = 2000;
          } else if (delay >= 1 * 60 * 60 * 1000) {
            actualDelay = 1000;
          } else {
            actualDelay = Math.min(delay, 2000);
          }
        }

        setTimeout(async () => {
          try {
            // Lazy load processor to avoid circular dependencies
            const { WhatsappProcessor } = await import('../../modules/whatsapp/whatsapp.processor');
            const processor = this.moduleRef.get(WhatsappProcessor, { strict: false });
            await processor.process(job);
          } catch (err) {
            console.error(`Failed to process mock WhatsApp job ${name}:`, err);
          }
        }, actualDelay);

        return job;
      }) as any;

      // Mock notificationQueue
      const originalNotificationAdd = this.notificationQueue.add.bind(this.notificationQueue);
      this.notificationQueue.add = (async (name: string, data: any, opts?: any) => {
        const jobId = `mock_job_notif_${Date.now()}`;
        const job = { id: jobId, name, data, opts } as any;

        setImmediate(async () => {
          try {
            const { NotificationProcessor } = await import('../../modules/notification/notification.processor');
            const processor = this.moduleRef.get(NotificationProcessor, { strict: false });
            await processor.process(job);
          } catch (err) {
            console.error(`Failed to process mock Notification job ${name}:`, err);
          }
        });

        return job;
      }) as any;
    }
  }
}
