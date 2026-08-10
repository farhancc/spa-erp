import { Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BookingItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffId?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  outletId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;

  @ApiProperty({ type: [BookingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items: BookingItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  couponDiscount?: number;
}
