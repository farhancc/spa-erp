import { IsString, IsOptional, IsNotEmpty, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ default: 'PERCENTAGE' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ default: 'MANUAL' })
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  perCustomerLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  validUntil?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outletId?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  perCustomerLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outletId?: string;
}
