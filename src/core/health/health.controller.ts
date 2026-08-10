import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/public.decorator';
import * as net from 'net';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  async getHealth() {
    let databaseStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (err) {
      databaseStatus = 'error';
    }

    const host = this.config.get<string>('app.redis.host') ?? 'localhost';
    const port = this.config.get<number>('app.redis.port') ?? 6379;

    let redisStatus = 'disconnected';
    const isRunning = await this.isRedisRunning(host, port);
    if (isRunning) {
      redisStatus = 'connected';
    } else if (process.env.NODE_ENV === 'test') {
      redisStatus = 'mocked';
    }

    const isHealthy = databaseStatus === 'connected' && (redisStatus === 'connected' || process.env.NODE_ENV === 'test');

    return {
      status: isHealthy ? 'ok' : 'error',
      database: databaseStatus,
      redis: redisStatus,
    };
  }

  private async isRedisRunning(host: string, port: number): Promise<boolean> {
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
}
