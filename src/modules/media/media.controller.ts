import { Controller, Get, Post, Delete, Body, Query, Param } from '@nestjs/common';
import { MediaService } from './media.service';
import { Public } from '../../core/auth/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Public()
  @Get()
  async findAll(@Query('folder') folder?: string) {
    return this.mediaService.findAll(folder);
  }

  @Public()
  @Post()
  async create(
    @Body() dto: {
      url: string;
      publicId: string;
      type: string;
      folder?: string;
      altText?: string;
      sizeBytes?: number;
      width?: number;
      height?: number;
      outletId?: string;
    },
  ) {
    return this.mediaService.create(dto);
  }

  @Public()
  @Post('upload')
  async upload(
    @Body() dto: {
      file: string;
      folder?: string;
    },
  ) {
    return this.mediaService.uploadBase64(dto.file, dto.folder);
  }

  @Public()
  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    return this.mediaService.deleteById(id);
  }
}
