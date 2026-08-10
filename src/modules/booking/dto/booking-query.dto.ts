import { IsOptional, IsString, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../../shared/types/enums';

export class BookingQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  customerId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  outletId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  staffId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional() @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  from?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
