import { Injectable, NotFoundException } from '@nestjs/common';
import { CmsRepository } from './cms.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';

@Injectable()
export class CmsService {
  constructor(
    private readonly cmsRepo: CmsRepository,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async getOrCreateWebsite(): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    let website: any = await this.cmsRepo.findWebsiteByTenant(tenantId);
    
    if (!website) {
      const createdWebsite = await this.cmsRepo.createWebsite(tenantId, 'LUXURY');
      // Create a default home page
      const homePage = await this.cmsRepo.upsertPage(createdWebsite.id, 'Home Page', 'home');
      // Create sample section
      await this.cmsRepo.savePageSections(homePage.id, [
        {
          type: 'HERO',
          data: JSON.stringify({
            title: 'Experience Premium Grooming',
            subtitle: 'Crafted for perfection by top stylists',
          }),
          sortOrder: 0,
        },
      ]);
      // Refetch with pages included
      website = await this.cmsRepo.findWebsiteByTenant(tenantId);
    }
    
    if (!website) {
      throw new NotFoundException('Failed to retrieve or create tenant website CMS configuration.');
    }
    
    return website;
  }

  async updateWebsiteConfig(dto: {
    template?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    isPublished?: boolean;
    useCustomCode?: boolean;
    customHtml?: string;
    customCss?: string;
    customJs?: string;
  }) {
    const website = await this.getOrCreateWebsite();
    return this.cmsRepo.saveWebsiteConfig(website.id, dto);
  }

  async getPublicData(tenantSlug: string) {
    const data = await this.cmsRepo.getPublicTenantData(tenantSlug);
    if (!data) throw new NotFoundException(`Tenant '${tenantSlug}' not found.`);
    return data;
  }

  async getPublicWebsiteConfig(tenantSlug: string) {
    const config = await this.cmsRepo.findWebsiteByTenantSlug(tenantSlug);
    if (!config) throw new NotFoundException(`Website config for '${tenantSlug}' not found.`);
    return config;
  }

  async savePageSections(
    slug: string,
    sections: Array<{ type: string; data: any; sortOrder: number }>,
    title: string = 'Page',
  ) {
    const website = await this.getOrCreateWebsite();
    const page = await this.cmsRepo.upsertPage(website.id, title, slug);
    const serializedSections = sections.map((sec) => ({
      type: sec.type,
      data: typeof sec.data === 'string' ? sec.data : JSON.stringify(sec.data),
      sortOrder: sec.sortOrder,
    }));
    return this.cmsRepo.savePageSections(page.id, serializedSections);
  }
}
