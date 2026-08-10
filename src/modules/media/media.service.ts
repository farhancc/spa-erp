import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaAsset } from '@prisma/client';
import { MediaRepository } from './media.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepo: MediaRepository,
    private readonly tenantCtx: TenantContextService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(folder?: string): Promise<MediaAsset[]> {
    const tenantId = this.tenantCtx.tenantId;
    return this.mediaRepo.findByTenant(tenantId, folder);
  }

  async create(dto: {
    url: string;
    publicId: string;
    type: string;
    folder?: string;
    altText?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
    outletId?: string;
  }): Promise<MediaAsset> {
    const tenantId = this.tenantCtx.tenantId;
    return this.mediaRepo.create({
      tenantId,
      url: dto.url,
      publicId: dto.publicId,
      type: dto.type,
      folder: dto.folder || null,
      altText: dto.altText || null,
      sizeBytes: dto.sizeBytes || null,
      width: dto.width || null,
      height: dto.height || null,
      outletId: dto.outletId || null,
    } as any);
  }

  async uploadBase64(base64Str: string, folder = 'general'): Promise<MediaAsset> {
    const tenantId = this.tenantCtx.tenantId;

    cloudinary.config({
      cloud_name: this.configService.get<string>('app.cloudinary.cloudName'),
      api_key: this.configService.get<string>('app.cloudinary.apiKey'),
      api_secret: this.configService.get<string>('app.cloudinary.apiSecret'),
    });

    try {
      // Force WebP conversion via Cloudinary eager transformation
      const uploadResult = await cloudinary.uploader.upload(base64Str, {
        folder: `tenants/${tenantId}/${folder}`,
        format: 'webp',          // Convert all uploads to WebP
        quality: 'auto:good',    // Auto-compress while preserving quality
        fetch_format: 'auto',
      });

      // Derive the canonical WebP URL (Cloudinary returns .webp when format is set)
      const webpUrl = uploadResult.secure_url.replace(/\.[^.]+$/, '.webp');

      return this.mediaRepo.create({
        tenantId,
        url: webpUrl,
        publicId: uploadResult.public_id,
        type: 'image',
        folder: folder || null,
        sizeBytes: uploadResult.bytes || null,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
      } as any);
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message || error}`);
    }
  }

  async deleteById(id: string): Promise<{ deleted: boolean }> {
    const tenantId = this.tenantCtx.tenantId;

    // Find the asset first (ensure it belongs to this tenant)
    const assets = await this.mediaRepo.findByTenant(tenantId);
    const asset = assets.find((a) => a.id === id);

    if (!asset) {
      throw new NotFoundException('Media asset not found or does not belong to your tenant.');
    }

    cloudinary.config({
      cloud_name: this.configService.get<string>('app.cloudinary.cloudName'),
      api_key: this.configService.get<string>('app.cloudinary.apiKey'),
      api_secret: this.configService.get<string>('app.cloudinary.apiSecret'),
    });

    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(asset.publicId, { invalidate: true });
    } catch (cloudErr) {
      console.warn(`Cloudinary deletion warning for ${asset.publicId}:`, cloudErr);
      // Continue with DB deletion even if Cloudinary fails (asset may already be gone)
    }

    // Delete from database
    await this.mediaRepo.delete(id);

    return { deleted: true };
  }
}
