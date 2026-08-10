import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiProperty()
  @IsNumber()
  total: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  outletId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string; // DRAFT, PAID, CANCELLED

  @ApiProperty()
  @IsNumber()
  subtotal: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gstAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  loyaltyDiscount?: number;

  @ApiProperty()
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string; // CASH, CARD, UPI

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoicePaymentSplitDto)
  payments?: InvoicePaymentSplitDto[];
}

export class InvoicePaymentSplitDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}
