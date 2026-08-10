import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpsertCommissionDto {
  @ApiProperty({ description: 'Staff user ID' })
  @IsString()
  staffId: string;

  @ApiPropertyOptional({ description: 'Service ID — omit for the default fallback rate' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FLAT'], default: 'PERCENTAGE' })
  @IsEnum(['PERCENTAGE', 'FLAT'])
  type: 'PERCENTAGE' | 'FLAT';

  @ApiProperty({ example: 15, description: '15 = 15% or ₹15 flat' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate: number;
}

export class RecordTipDto {
  @ApiProperty({ description: 'Invoice ID the tip is attached to' })
  @IsString()
  invoiceId: string;

  @ApiPropertyOptional({ description: 'Staff member who received the tip' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: ['CASH', 'CARD', 'UPI'], default: 'CASH' })
  @IsEnum(['CASH', 'CARD', 'UPI'])
  method: 'CASH' | 'CARD' | 'UPI';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClockInDto {
  @ApiProperty({ description: 'Staff user ID' })
  @IsString()
  staffId: string;

  @ApiProperty({ description: 'Outlet ID where the shift is taking place' })
  @IsString()
  outletId: string;

  @ApiPropertyOptional({ description: 'ISO datetime override (defaults to now)' })
  @IsOptional()
  @IsString()
  clockIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClockOutDto {
  @ApiPropertyOptional({ description: 'ISO datetime override (defaults to now)' })
  @IsOptional()
  @IsString()
  clockOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GeneratePayrollDto {
  @ApiProperty({ description: 'Staff user ID' })
  @IsString()
  staffId: string;

  @ApiProperty({ description: 'Period start ISO date e.g. 2025-06-01' })
  @IsString()
  periodStart: string;

  @ApiProperty({ description: 'Period end ISO date e.g. 2025-06-30' })
  @IsString()
  periodEnd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outletId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApprovePayrollDto {
  @ApiProperty({ enum: ['APPROVED', 'PAID'] })
  @IsEnum(['APPROVED', 'PAID'])
  status: 'APPROVED' | 'PAID';
}
