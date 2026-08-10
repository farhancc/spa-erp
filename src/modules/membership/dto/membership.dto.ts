import { IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'LuxCuts VIP Club' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '4 Haircuts + 2 Spas per month' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1999 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ example: 'Monthly', enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual'] })
  @IsString()
  duration: string;

  @ApiPropertyOptional({ example: 'service_id_1,service_id_2' })
  @IsString()
  @IsOptional()
  services?: string;
}

export class UpdateMembershipPlanDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  price?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  services?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class EnrollCustomerDto {
  @ApiProperty({ example: 'customer_cuid' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 'plan_cuid' })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
