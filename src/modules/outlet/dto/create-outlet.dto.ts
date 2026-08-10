import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  IsEmail,
  Min,
  Max,
} from 'class-validator';

export class CreateOutletDto {
  @ApiProperty({ example: 'LuxCuts Downtown' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'downtown', description: 'URL-safe slug (auto-generated if omitted)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'downtown@luxcuts.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '12, MG Road' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Bangalore' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: 12.9716 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 77.5946 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
