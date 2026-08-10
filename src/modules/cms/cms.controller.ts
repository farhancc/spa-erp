import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CmsService } from './cms.service';
import { Public } from '../../core/auth/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RequiresFeature } from '../../core/permissions/features.decorator';

@ApiTags('CMS')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @RequiresFeature('cmsEnabled')
  @Get('config')
  async getConfig() {
    return this.cmsService.getOrCreateWebsite();
  }

  @Public()
  @RequiresFeature('cmsEnabled')
  @Post('config')
  async updateConfig(
    @Body() dto: {
      template?: string;
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      isPublished?: boolean;
      useCustomCode?: boolean;
      customHtml?: string;
      customCss?: string;
      customJs?: string;
    },
  ) {
    return this.cmsService.updateWebsiteConfig(dto);
  }

  @Public()
  @RequiresFeature('cmsEnabled')
  @Post('page/:slug/sections')
  async saveSections(
    @Param('slug') slug: string,
    @Body() body: {
      title?: string;
      sections: Array<{ type: string; data: any; sortOrder: number }>;
    },
  ) {
    return this.cmsService.savePageSections(slug, body.sections, body.title);
  }

  /**
   * Public read-only endpoint — no auth required.
   * Serves services, stylists & outlets for custom HTML storefronts.
   */
  @Public()
  @Get('public/:tenantSlug/data')
  async getPublicData(@Param('tenantSlug') tenantSlug: string) {
    return this.cmsService.getPublicData(tenantSlug);
  }

  /**
   * Public website config — returns useCustomCode flag + customHtml/CSS/JS.
   */
  @Public()
  @Get('public/:tenantSlug/config')
  async getPublicWebsiteConfig(@Param('tenantSlug') tenantSlug: string) {
    return this.cmsService.getPublicWebsiteConfig(tenantSlug);
  }
}
