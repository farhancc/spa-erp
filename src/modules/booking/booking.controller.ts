import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '../../shared/types/enums';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CurrentUser, AuthUser } from '../../core/auth/current-user.decorator';
import { Roles } from '../../core/permissions/roles.decorator';
import { Public } from '../../core/auth/public.decorator';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({ summary: 'Get busy slots for a stylist on a specific date' })
  @Public()
  @Get('slots')
  async getBusySlots(
    @Query('outletId') outletId: string,
    @Query('staffId') staffId: string,
    @Query('date') dateStr: string,
  ) {
    if (!outletId || !staffId || !dateStr) {
      throw new BadRequestException('Missing outletId, staffId, or date');
    }
    const date = new Date(dateStr);
    return this.bookingService.findStaffSlots(outletId, staffId, date);
  }

  @ApiOperation({ summary: 'Create a new booking' })
  @Post()
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, 'CUSTOMER' as any)
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (user.role === 'CUSTOMER') {
      dto.customerId = user.id;
    }
    return this.bookingService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'List all bookings (paginated, filterable)' })
  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, Role.STYLIST, 'CUSTOMER' as any)
  findAll(
    @Query() query: BookingQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (user.role === 'CUSTOMER') {
      query.customerId = user.id;
    }
    return this.bookingService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a single booking' })
  @Get(':id')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, Role.STYLIST, 'CUSTOMER' as any)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const booking = await this.bookingService.findOne(id);
    if (user.role === 'CUSTOMER' && booking.customerId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }
    return booking;
  }

  @ApiOperation({ summary: 'Update booking details' })
  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingService.update(id, dto);
  }

  @ApiOperation({ summary: 'Cancel a booking' })
  @Patch(':id/cancel')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, 'CUSTOMER' as any)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (user.role === 'CUSTOMER') {
      const booking = await this.bookingService.findOne(id);
      if (booking.customerId !== user.id) {
        throw new ForbiddenException('You do not have permission to cancel this booking');
      }
    }
    return this.bookingService.cancel(id, reason);
  }

  @ApiOperation({ summary: 'Mark a booking as completed' })
  @Patch(':id/complete')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string) {
    return this.bookingService.complete(id);
  }
}
