import { PrismaService } from '../../core/database/prisma.service';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * BaseRepository<TModel>
 *
 * Provides common CRUD + pagination for all domain repositories.
 * Domain repositories extend this and add domain-specific methods.
 *
 * The `model` property must match the Prisma delegate name exactly.
 *
 * @example
 * class BookingRepository extends BaseRepository<Booking> {
 *   protected model = 'booking' as const;
 *   constructor(prisma: PrismaService, tenantCtx: TenantContextService) {
 *     super(prisma, tenantCtx);
 *   }
 * }
 */
export abstract class BaseRepository<TModel> {
  protected abstract readonly model: string;

  constructor(protected readonly prisma: PrismaService) {}

  protected get delegate(): any {
    return (this.prisma as any)[this.model];
  }

  async findById(id: string): Promise<TModel | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<TModel> {
    const record = await this.delegate.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`${this.model} with id "${id}" not found`);
    }
    return record;
  }

  async findAll(
    where: Record<string, unknown> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<TModel>> {
    const pageVal = Number(options.page ?? 1);
    const limitVal = Number(options.limit ?? 20);
    const page = isNaN(pageVal) ? 1 : Math.max(1, pageVal);
    const limit = isNaN(limitVal) ? 20 : Math.min(100, limitVal);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.delegate.findMany({ where, skip, take: limit }),
      this.delegate.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: Record<string, unknown>): Promise<TModel> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: Record<string, unknown>): Promise<TModel> {
    return this.delegate.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.delegate.delete({ where: { id } });
  }

  async count(where: Record<string, unknown> = {}): Promise<number> {
    return this.delegate.count({ where });
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await this.delegate.count({ where });
    return count > 0;
  }
}
