import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { Roles } from '../../core/permissions/roles.decorator';
import { Role } from '../../shared/types/enums';
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
  EnrollCustomerDto,
} from './dto/membership.dto';

@ApiTags('Memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  // ─── Plans ─────────────────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'List all VIP membership plans for this tenant' })
  getPlans() {
    return this.membershipService.getPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a single membership plan' })
  getPlan(@Param('id') id: string) {
    return this.membershipService.getPlan(id);
  }

  @Post('plans')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new VIP membership plan' })
  createPlan(@Body() dto: CreateMembershipPlanDto) {
    return this.membershipService.createPlan(dto);
  }

  @Patch('plans/:id')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Update a membership plan' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateMembershipPlanDto) {
    return this.membershipService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a membership plan (cancels active enrollments)' })
  deletePlan(@Param('id') id: string) {
    return this.membershipService.deletePlan(id);
  }

  // ─── Enrollments ───────────────────────────────────────────────────────────

  @Get('enrollments')
  @ApiOperation({ summary: 'List enrollments (optionally filtered by planId or customerId)' })
  getEnrollments(
    @Query('planId') planId?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.membershipService.getEnrollments(planId, customerId);
  }

  @Post('enrollments')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Enroll a customer in a membership plan' })
  enrollCustomer(@Body() dto: EnrollCustomerDto) {
    return this.membershipService.enrollCustomer(dto);
  }

  @Delete('enrollments/:id')
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke/cancel a customer enrollment' })
  revokeEnrollment(@Param('id') id: string) {
    return this.membershipService.revokeEnrollment(id);
  }
}
