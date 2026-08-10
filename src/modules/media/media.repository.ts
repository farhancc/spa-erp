import { Injectable } from '@nestjs/common';
import { MediaAsset } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { BaseRepository } from '../../shared/base/base.repository';

@Injectable()
export class MediaRepository extends BaseRepository<MediaAsset> {
  protected readonly model = 'mediaAsset';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenant(tenantId: string, folder?: string): Promise<MediaAsset[]> {
    const where: any = { tenantId };
    if (folder) {
      where.folder = folder;
    }
    return this.prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
