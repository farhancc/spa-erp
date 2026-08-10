import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Role } from '../../shared/types/enums';
import { CurrentUser, AuthUser } from '../../core/auth/current-user.decorator';
import { Roles } from '../../core/permissions/roles.decorator';
import { Public } from '../../core/auth/public.decorator';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiOperation({ summary: 'Create a new user/staff' })
  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: AuthUser) {
    // 1. Prevent anyone from creating an OWNER through this endpoint
    if (dto.role === 'OWNER') {
      throw new ForbiddenException('Only Super Admin can provision Brand Owners');
    }

    // 2. Prevent MANAGERS from creating other MANAGERS (only OWNER can create brand manager)
    if (currentUser.role === 'MANAGER' && dto.role === 'MANAGER') {
      throw new ForbiddenException('Brand Managers cannot create other Managers');
    }

    return this.userService.create(dto);
  }

  @ApiOperation({ summary: 'List all users (paginated or all)' })
  @Public()
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('all') all?: boolean,
    @Query('outletId') outletId?: string,
  ) {
    if (all) {
      return this.userService.findAllList(outletId);
    }
    return this.userService.findAll({ page, limit, search, role, outletId });
  }

  @ApiOperation({ summary: 'Create a staff leave' })
  @Post('leaves')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  createLeave(@Body() dto: { staffId: string; startDate: string; endDate: string; reason?: string }) {
    return this.userService.createLeave({
      staffId: dto.staffId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      reason: dto.reason,
    });
  }

  @ApiOperation({ summary: 'Get staff leaves' })
  @Get('leaves')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, Role.STYLIST)
  findLeaves(
    @Query('staffId') staffId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.userService.findLeaves({ staffId, from, to });
  }

  @ApiOperation({ summary: 'Delete a staff leave' })
  @Delete('leaves/:id')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, Role.STYLIST)
  deleteLeave(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.userService.deleteLeave(id, currentUser);
  }

  @ApiOperation({ summary: 'Create a staff blocked slot' })
  @Post('blocked-slots')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST)
  createBlockedSlot(@Body() dto: { staffId: string; outletId: string; scheduledAt: string; endsAt: string; reason?: string }) {
    return this.userService.createBlockedSlot({
      staffId: dto.staffId,
      outletId: dto.outletId,
      scheduledAt: new Date(dto.scheduledAt),
      endsAt: new Date(dto.endsAt),
      reason: dto.reason,
    });
  }

  @ApiOperation({ summary: 'Get staff blocked slots' })
  @Get('blocked-slots')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, Role.STYLIST)
  findBlockedSlots(
    @Query('staffId') staffId?: string,
    @Query('outletId') outletId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.userService.findBlockedSlots({ staffId, outletId, from, to });
  }

  @ApiOperation({ summary: 'Delete a staff blocked slot' })
  @Delete('blocked-slots/:id')
  @Roles(Role.OWNER, Role.MANAGER, Role.RECEPTIONIST, Role.STYLIST)
  deleteBlockedSlot(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.userService.deleteBlockedSlot(id, currentUser);
  }

  @ApiOperation({ summary: 'Get a single user' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: 'Update user details' })
  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    const targetUser = await this.userService.findOne(id);

    // 1. Prevent changing any user to an OWNER
    if (dto.role === 'OWNER') {
      throw new ForbiddenException('Cannot elevate user to Brand Owner');
    }

    // 2. Prevent MANAGER from updating OWNER
    if (currentUser.role === 'MANAGER' && targetUser.role === 'OWNER') {
      throw new ForbiddenException('Brand Managers cannot modify Brand Owners');
    }

    // 3. Prevent MANAGER from promoting anyone to MANAGER
    if (currentUser.role === 'MANAGER' && dto.role === 'MANAGER') {
      throw new ForbiddenException('Brand Managers cannot promote users to Manager');
    }

    return this.userService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a user' })
  @Delete(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    const targetUser = await this.userService.findOne(id);

    // 1. Prevent anyone from deleting the OWNER
    if (targetUser.role === 'OWNER') {
      throw new ForbiddenException('Cannot delete Brand Owner');
    }

    // 2. Prevent MANAGER from deleting another MANAGER
    if (currentUser.role === 'MANAGER' && targetUser.role === 'MANAGER') {
      throw new ForbiddenException('Brand Managers cannot delete other Managers');
    }

    return this.userService.remove(id);
  }
}
