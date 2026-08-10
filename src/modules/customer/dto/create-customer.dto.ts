import { IsString, IsOptional, IsEmail, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredOutletId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outletId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalVisits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalSpend?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referredByCode?: string;
}
