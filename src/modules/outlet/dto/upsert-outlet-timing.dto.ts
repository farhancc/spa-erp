import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class UpsertOutletTimingDto {
  @ApiProperty({ example: 1, description: '0=Sun, 1=Mon … 6=Sat' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  openTime: string;

  @ApiProperty({ example: '21:00' })
  @IsString()
  closeTime: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}
