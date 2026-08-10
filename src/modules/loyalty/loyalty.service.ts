import { Injectable, NotFoundException } from '@nestjs/common';
import { LoyaltyRepository } from './loyalty.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly loyaltyRepo: LoyaltyRepository,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async getOrCreateProgram() {
    const tenantId = this.tenantCtx.tenantId;
    let program = await this.loyaltyRepo.findProgramByTenant(tenantId);
    if (!program) {
      program = await this.loyaltyRepo.createProgram(tenantId, 'Premium Club Loyalty Points');
    }
    return program;
  }

  async updateProgram(dto: any) {
    const program = await this.getOrCreateProgram();
    return this.loyaltyRepo.updateProgram(program.id, dto);
  }

  async getOrCreateAccount(customerId: string) {
    const tenantId = this.tenantCtx.tenantId;
    const program = await this.getOrCreateProgram();
    
    let account = await this.loyaltyRepo.findAccount(tenantId, customerId);
    if (!account) {
      account = await this.loyaltyRepo.createAccount(tenantId, customerId, program.id);
    }
    return account;
  }

  async adjustPoints(customerId: string, points: number, description?: string) {
    const account = await this.getOrCreateAccount(customerId);
    const type = points >= 0 ? 'EARN' : 'REDEEM';
    return this.loyaltyRepo.adjustPoints(account.id, points, type, description);
  }
}
