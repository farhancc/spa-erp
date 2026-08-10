import { DynamicModule, Module, Provider, Inject } from '@nestjs/common';

export const InjectQueue = (queueName: string) => Inject(`BullQueue_${queueName}`);

export const processorsRegistry = new Map<string, any>();

export function Processor(queueName: string) {
  return function (target: any) {
    target.prototype.__queueName = queueName;
    // Apply NestJS Injectable decorator behavior so it can be registered in Nest dependency injection
    const Injectable = require('@nestjs/common').Injectable;
    Injectable()(target);
    return target;
  };
}

export class WorkerHost {
  constructor() {
    const queueName = (this as any).__queueName;
    if (queueName) {
      processorsRegistry.set(queueName, this);
      console.log(`[MockQueue] Registered processor for queue: ${queueName}`);
    }
  }

  async process(job: any): Promise<any> {
    throw new Error('process method must be implemented');
  }
}

export class MockQueue {
  constructor(private readonly name: string) {}

  async add(name: string, data: any, opts?: any) {
    console.log(`[MockQueue:${this.name}] Job added: ${name}`, JSON.stringify(data));

    // Simulate async background processing
    const delay = opts?.delay || 50;
    setTimeout(async () => {
      const processor = processorsRegistry.get(this.name);
      if (processor) {
        try {
          console.log(`[MockQueue:${this.name}] Processing job: ${name}...`);
          const mockJob = {
            id: Math.floor(Math.random() * 1000000).toString(),
            name,
            data,
            opts,
            updateProgress: async (value: number) => {
              console.log(`[MockQueue:${this.name}] Job ${name} progress: ${value}%`);
            },
          };
          await processor.process(mockJob);
          console.log(`[MockQueue:${this.name}] Job completed successfully: ${name}`);
        } catch (err: any) {
          console.error(`[MockQueue:${this.name}] Job failed: ${name}. Error: ${err.message}`);
        }
      } else {
        console.log(`[MockQueue:${this.name}] No processor registered to handle this queue.`);
      }
    }, delay);

    return { id: Math.random().toString(), data };
  }
}

@Module({})
export class BullModule {
  static forRootAsync(options: any): DynamicModule {
    return {
      module: BullModule,
      providers: [],
      exports: [],
    };
  }

  static registerQueue(...queues: any[]): DynamicModule {
    const providers: Provider[] = queues.map((q) => {
      const name = typeof q === 'string' ? q : q.name;
      const token = `BullQueue_${name}`;
      return {
        provide: token,
        useFactory: () => new MockQueue(name),
      };
    });

    return {
      module: BullModule,
      providers: providers,
      exports: providers,
    };
  }
}
