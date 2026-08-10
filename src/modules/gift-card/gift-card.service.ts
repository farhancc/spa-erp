import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';

@Injectable()
export class GiftCardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async issueGiftCard(dto: {
    code?: string;
    initialValue: number;
    customerId?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    validityDays?: number;
  }) {
    const tenantId = this.tenantCtx.tenantId;

    // Generate random code if not provided
    const cardCode = dto.code
      ? dto.code.toUpperCase()
      : `GC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Check duplicate
    const existing = await this.prisma.giftCard.findUnique({
      where: { code: cardCode },
    });
    if (existing) {
      throw new BadRequestException(`Gift card with code "${cardCode}" already exists.`);
    }

    const validUntil = dto.validityDays
      ? new Date(Date.now() + dto.validityDays * 24 * 3600 * 1000)
      : null;

    return this.prisma.giftCard.create({
      data: {
        tenantId,
        code: cardCode,
        initialValue: dto.initialValue,
        balance: dto.initialValue,
        customerId: dto.customerId || null,
        recipientEmail: dto.recipientEmail || null,
        recipientPhone: dto.recipientPhone || null,
        validUntil,
        status: 'ACTIVE',
      },
    });
  }

  async getGiftCard(code: string) {
    const tenantId = this.tenantCtx.tenantId;

    const card = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
      include: { customer: true },
    });

    if (!card || card.tenantId !== tenantId) {
      throw new NotFoundException(`Gift card with code "${code}" not found.`);
    }

    // Check expiry
    if (card.status === 'ACTIVE' && card.validUntil && new Date() > card.validUntil) {
      const expiredCard = await this.prisma.giftCard.update({
        where: { id: card.id },
        data: { status: 'EXPIRED' },
      });
      return expiredCard;
    }

    return card;
  }

  async redeemGiftCard(code: string, amount: number) {
    const tenantId = this.tenantCtx.tenantId;

    const card = await this.getGiftCard(code);

    if (card.status !== 'ACTIVE') {
      throw new BadRequestException(`Gift card is not active. Status: ${card.status}`);
    }

    const currentBalance = Number(card.balance);
    if (currentBalance < amount) {
      throw new BadRequestException(`Insufficient gift card balance. Available: ₹${currentBalance}, Requested: ₹${amount}`);
    }

    const newBalance = currentBalance - amount;
    const newStatus = newBalance === 0 ? 'REDEEMED' : 'ACTIVE';

    return this.prisma.giftCard.update({
      where: { id: card.id },
      data: {
        balance: newBalance,
        status: newStatus,
      },
    });
  }
}
