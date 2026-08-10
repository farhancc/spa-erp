import { IsString, IsOptional, IsNumber, IsBoolean, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string; // The category name, e.g. "Grooming"

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  duration: number; // minutes

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string; // MEN, WOMEN, UNISEX

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyPart?: string; // FACE, HEAD, HAIR, BODY, LEGS, HANDS, NAILS, FULL_BODY, OTHER

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gstType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  loyaltyPoints?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offerPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCombo?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  comboServiceIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outletId?: string;
}
