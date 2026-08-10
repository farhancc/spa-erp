import { execSync } from 'child_process';

let isRedisOnline = false;
try {
  if (process.env.REDIS_HOST) {
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT || '6379';
    execSync(`timeout 1 bash -c "cat < /dev/null > /dev/tcp/${redisHost}/${redisPort}" 2>/dev/null`);
    isRedisOnline = true;
  }
} catch (e) {
  isRedisOnline = false;
}

if (!isRedisOnline) {
  console.warn('⚠️  Redis is offline. Monkey-patching @nestjs/bullmq to run inside mock memory queues.');

  const mockProcessors = new Map<string, any>();
  (global as any).mockProcessors = mockProcessors;

  const mockBullmq = {
    Processor: (queueName: any) => {
      const qName = typeof queueName === 'string' ? queueName : (queueName?.name || '');
      return (target: any) => {
        target.prototype.queueName = qName;
        return target;
      };
    },
    WorkerHost: class MockWorkerHost {
      constructor() {
        const queueName = (this as any).queueName;
        if (queueName) {
          mockProcessors.set(queueName, this);
        }
      }
      async process(job: any): Promise<any> {
        return null;
      }
    },
    InjectQueue: (name: string) => {
      const Inject = require('@nestjs/common').Inject;
      return Inject(`BullQueue_${name}`);
    },
    BullModule: (() => {
      class MockBullModule { }

      (MockBullModule as any).forRoot = () => ({
        module: MockBullModule,
      });

      (MockBullModule as any).forRootAsync = () => ({
        module: MockBullModule,
      });

      (MockBullModule as any).registerQueue = (...queues: any[]) => {
        const queueNames = queues.map(q => typeof q === 'string' ? q : q.name);
        const mockProviders = queueNames.map(name => ({
          provide: `BullQueue_${name}`,
          useValue: {
            name,
            add: async (jobName: string, data: any) => {
              console.log(`[MockQueue:${name}] Job added: ${jobName}`, data);
              const job = { id: Math.random().toString(), name: jobName, data };

              // Trigger processor asynchronously to simulate real queue behavior
              setTimeout(async () => {
                const processor = mockProcessors.get(name);
                if (processor) {
                  try {
                    await processor.process(job);
                  } catch (err: any) {
                    console.error(`[MockQueue:${name}] Error processing job ${jobName}:`, err.message);
                  }
                } else {
                  console.warn(`[MockQueue:${name}] No processor registered for queue: ${name}`);
                }
              }, 50);

              return job;
            },
            on: () => { },
            emit: () => { },
          },
        }));

        return {
          module: MockBullModule,
          providers: mockProviders,
          exports: mockProviders,
        };
      };

      return MockBullModule;
    })()
  };

  const targetPath = require.resolve('@nestjs/bullmq');
  require.cache[targetPath] = {
    id: targetPath,
    filename: targetPath,
    loaded: true,
    exports: mockBullmq,
  } as any;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from './shared/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);

  // ─── Global Prefix ────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Middleware ────────────────────────────────────────────
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // ─── CORS ─────────────────────────────────────────────────
  const corsOriginsEnv = config.get<string>('CORS_ORIGINS') || 'http://localhost:3000';
  const allowedOrigins = corsOriginsEnv.split(',').map(o => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Swagger, mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Check if origin matches any allowed origins exactly
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check for subdomains of the allowed origins
      for (const allowedOrigin of allowedOrigins) {
        try {
          const url = new URL(allowedOrigin);
          const protocol = url.protocol; // e.g. "http:" or "https:"
          const hostname = url.hostname; // e.g. "careva.in" or "localhost"
          const port = url.port;         // e.g. "3000" or ""

          // Escape dot characters in hostname for regex
          const escapedHostname = hostname.replace(/\./g, '\\.');
          const portRegex = port ? `:${port}` : '';
          
          // Regex for subdomain match: protocol//anything.hostname[:port]
          const regex = new RegExp(`^${protocol}//[a-zA-Z0-9-_]+\\.${escapedHostname}${portRegex}$`);
          
          if (regex.test(origin)) {
            return callback(null, true);
          }
        } catch (e) {
          // Ignore invalid URL structures in CORS_ORIGINS env
        }
      }

      // Fallback checks for development convenience
      const devAllowed =
        origin === 'http://localhost:3000' ||
        origin === 'http://localhost:3001' ||
        /^https?:\/\/[^.]+\.lvh\.me(:\d+)?$/.test(origin) ||   // local dev subdomains
        /^https:\/\/[^.]+\.careva\.in$/.test(origin);            // prod subdomains

      if (devAllowed) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  });

  // ─── Global Pipes ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,           // auto-transform query params
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Global Filters ───────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── Global Interceptors ──────────────────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformResponseInterceptor(),
  );

  // ─── Swagger ──────────────────────────────────────────────
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Careva API')
      .setDescription('Multi-tenant Salon SaaS')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('access_token')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  console.log(`🚀 Careva API running on http://localhost:${port}/api/v1`);
}

bootstrap();
