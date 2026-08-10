import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Invoice } from '@prisma/client';
import { PosRepository } from './pos.repository';
import { TenantContextService } from '../../core/tenancy/tenant-context.service';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoicePaidEvent, ProductOutOfStockEvent, ProductLowStockEvent } from '../../core/events/domain-events';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class PosService {
  constructor(
    private readonly posRepo: PosRepository,
    private readonly tenantCtx: TenantContextService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const outOfStockProducts: any[] = [];
    const lowStockProducts: any[] = [];

    // Generate invoice number
    const invoiceNumber = await this.posRepo.generateInvoiceNumber(tenantId);

    // Default status to DRAFT if not provided, or PAID if paymentMethod is provided
    const status = dto.status || (dto.paymentMethod ? 'PAID' : 'DRAFT');
    const paidAmount = status === 'PAID' ? dto.totalAmount : 0;

    // Create Invoice with nested transaction
    const invoice = await this.prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const inv = await tx.invoice.create({
        data: {
          tenantId,
          outletId: dto.outletId,
          customerId: dto.customerId,
          bookingId: dto.bookingId || null,
          invoiceNumber,
          status,
          subtotal: dto.subtotal,
          discountAmount: dto.discountAmount ?? 0,
          gstAmount: dto.gstAmount ?? 0,
          loyaltyDiscount: dto.loyaltyDiscount ?? 0,
          totalAmount: dto.totalAmount,
          paidAmount,
          notes: dto.notes || null,
        },
      });

      // Audit log invoice creation
      await this.auditLog.record({
        tenantId,
        action: 'CREATE',
        entityName: 'Invoice',
        entityId: inv.id,
        newValues: inv,
      }, tx);

      // 2. Create Invoice Items
      if (dto.items && dto.items.length > 0) {
        // Fetch services & products to populate default HSN/SAC codes
        const serviceIds = dto.items.filter(i => i.serviceId).map(i => i.serviceId!);
        const productIds = dto.items.filter(i => i.productId).map(i => i.productId!);

        const dbServices = serviceIds.length > 0 
          ? await tx.service.findMany({ where: { id: { in: serviceIds }, tenantId } })
          : [];

        const dbProducts = productIds.length > 0
          ? await tx.product.findMany({ where: { id: { in: productIds }, tenantId } })
          : [];

        const invoiceItemsData = dto.items.map((item) => {
          let hsnSacCode: string | null | undefined = item.hsnSacCode;
          if (!hsnSacCode) {
            if (item.serviceId) {
              const svc = dbServices.find(s => s.id === item.serviceId);
              hsnSacCode = svc?.hsnSacCode || null;
            } else if (item.productId) {
              const prod = dbProducts.find(p => p.id === item.productId);
              hsnSacCode = prod?.hsnSacCode || null;
            }
          }

          return {
            invoiceId: inv.id,
            serviceId: item.serviceId || null,
            productId: item.productId || null,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            gstRate: item.gstRate ?? 0,
            gstAmount: item.gstAmount ?? 0,
            hsnSacCode,
            total: item.total,
          };
        });

        await tx.invoiceItem.createMany({
          data: invoiceItemsData,
        });

        // 2b. Decrement stock for product items (skip services)
        const productItems = dto.items.filter((i) => i.productId);
        for (const item of productItems) {
          const product = await tx.product.findFirst({
            where: { id: item.productId!, tenantId },
            select: { id: true, trackStock: true, stockQty: true, name: true, sku: true, outletId: true, lowStockThreshold: true },
          });
          if (!product || !product.trackStock) continue;

          const newQty = product.stockQty - item.quantity;
          if (newQty < 0) {
            throw new BadRequestException(`Insufficient stock for product "${product.name}". Available: ${product.stockQty}, Requested: ${item.quantity}`);
          }
          await tx.product.update({
            where: { id: product.id },
            data: { stockQty: newQty },
          });

          if (newQty === 0 && product.stockQty > 0) {
            outOfStockProducts.push(product);
          }

          if (newQty <= product.lowStockThreshold && product.stockQty > product.lowStockThreshold) {
            lowStockProducts.push({
              id: product.id,
              name: product.name,
              sku: product.sku,
              outletId: product.outletId,
              oldQty: product.stockQty,
              newQty,
            });
          }
        }
      }

      // 3. Create Payment if PAID (or split payment is provided)
      const hasSplitPayments = (dto as any).payments && (dto as any).payments.length > 0;
      const isPaid = status === 'PAID' || hasSplitPayments;

      if (isPaid) {
        const paymentRecords: any[] = [];

        if (hasSplitPayments) {
          for (const pay of (dto as any).payments!) {
            paymentRecords.push({
              tenantId,
              invoiceId: inv.id,
              method: pay.method,
              amount: pay.amount,
              reference: pay.reference || null,
            });
          }
        } else if (dto.paymentMethod) {
          paymentRecords.push({
            tenantId,
            invoiceId: inv.id,
            method: dto.paymentMethod,
            amount: dto.totalAmount,
            reference: null,
          });
        }

        let actualPaidSum = 0;
        for (const payData of paymentRecords) {
          const payment = await tx.payment.create({
            data: payData,
          });
          actualPaidSum += Number(payData.amount);

          // Audit log payment creation
          await this.auditLog.record({
            tenantId,
            action: 'CREATE',
            entityName: 'Payment',
            entityId: payment.id,
            newValues: payment,
          }, tx);
        }

        // Update invoice paidAmount
        if (actualPaidSum > 0) {
          await tx.invoice.update({
            where: { id: inv.id },
            data: { 
              paidAmount: actualPaidSum,
              status: actualPaidSum >= Number(dto.totalAmount) ? 'PAID' : 'PARTIALLY_PAID'
            },
          });
        }

        // 4. Update Customer stats
        const updatedCustomer = await tx.customer.update({
          where: { id: dto.customerId },
          data: {
            totalVisits: { increment: 1 },
            totalSpend: { increment: dto.totalAmount },
            lastVisitAt: new Date(),
          },
        });

        // Trigger automatic coupon credit on referee's first visit
        if (updatedCustomer.totalVisits === 1 && updatedCustomer.referredById) {
          const referrerId = updatedCustomer.referredById;
          const referrer = await tx.customer.findUnique({
            where: { id: referrerId },
          });

          if (referrer) {
            const refCode = `REF-${referrer.referralCode || 'VAL'}-${Math.floor(1000 + Math.random() * 9000)}`;
            const validFrom = new Date();
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 30); // 30 days validity

            await tx.coupon.create({
              data: {
                tenantId,
                code: refCode,
                type: 'FLAT',
                trigger: 'REFERRAL',
                value: 150.0,
                minOrderValue: 500.0,
                validFrom,
                validUntil,
                isActive: true,
              },
            });
          }
        }
      }

      // 5. Record Coupon Usage if couponId is provided
      if (dto.couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: dto.couponId },
        });

        if (coupon) {
          const couponUsage = await tx.couponUsage.create({
            data: {
              couponId: dto.couponId,
              customerId: dto.customerId,
              invoiceId: inv.id,
              discount: dto.discountAmount ?? 0,
            },
          });

          // Increment coupon usedCount
          await tx.coupon.update({
            where: { id: dto.couponId },
            data: { usedCount: { increment: 1 } },
          });

          // Audit log coupon usage
          await this.auditLog.record({
            tenantId,
            action: 'CREATE',
            entityName: 'CouponUsage',
            entityId: couponUsage.id,
            newValues: couponUsage,
          }, tx);
        }
      }

      return inv;
    });

    // Fetch complete invoice with details
    const fullInvoice = await this.posRepo.findByIdWithDetails(invoice.id);

    // Emit event if invoice is paid
    if (status === 'PAID') {
      // Fetch loyalty program to calculate points dynamically
      const loyaltyProgram = await this.prisma.loyaltyProgram.findUnique({
        where: { tenantId },
      });

      let pointsEarned = 0;
      if (loyaltyProgram) {
        if (loyaltyProgram.isActive) {
          // 1. Amount-based points
          pointsEarned += Math.floor(dto.subtotal * loyaltyProgram.pointsPerRupee);

          // 2. Flat booking action points
          if (dto.bookingId) {
            pointsEarned += loyaltyProgram.bookingPoints || 0;
          }

          // 3. Service-specific points
          if (dto.items && dto.items.length > 0) {
            const serviceIds = dto.items.filter(i => i.serviceId).map(i => i.serviceId!);
            if (serviceIds.length > 0) {
              const dbServices = await this.prisma.service.findMany({
                where: { id: { in: serviceIds }, tenantId },
                select: { id: true, loyaltyPoints: true },
              });
              for (const item of dto.items) {
                if (item.serviceId) {
                  const svc = dbServices.find(s => s.id === item.serviceId);
                  if (svc && svc.loyaltyPoints) {
                    pointsEarned += svc.loyaltyPoints * (item.quantity || 1);
                  }
                }
              }
            }
          }
        }
      } else {
        // Fallback to default of 1 point per rupee spent
        pointsEarned = Math.floor(dto.subtotal * 1.0);
      }

      this.eventEmitter.emit(
        InvoicePaidEvent.EVENT,
        new InvoicePaidEvent(
          tenantId,
          fullInvoice.id,
          fullInvoice.customerId,
          fullInvoice.totalAmount,
          pointsEarned,
        ),
      );
    }

    // Emit out of stock notifications
    for (const prod of outOfStockProducts) {
      this.eventEmitter.emit(
        ProductOutOfStockEvent.EVENT,
        new ProductOutOfStockEvent(
          tenantId,
          prod.id,
          prod.name,
          prod.sku,
          prod.outletId,
        ),
      );
    }

    // Emit low stock notifications / reorder triggers
    for (const prod of lowStockProducts) {
      this.eventEmitter.emit(
        ProductLowStockEvent.EVENT,
        new ProductLowStockEvent(
          tenantId,
          prod.id,
          prod.name,
          prod.sku,
          prod.outletId,
          prod.oldQty,
          prod.newQty,
        ),
      );
    }

    return fullInvoice;
  }

  async findAll(options: { page?: number; limit?: number; search?: string; customerId?: string; status?: string; outletId?: string; from?: Date | string; to?: Date | string } = {}): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    return this.posRepo.findByTenant(tenantId, options);
  }

  async findOne(id: string, outletId?: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const invoice = await this.posRepo.findByIdWithDetails(id);

    if (!invoice || invoice.tenantId !== tenantId || (outletId && invoice.outletId !== outletId)) {
      throw new NotFoundException(`Invoice with ID "${id}" not found.`);
    }

    return invoice;
  }

  async update(id: string, dto: { status?: string; notes?: string }, outletId?: string): Promise<any> {
    const tenantId = this.tenantCtx.tenantId;
    const invoice = await this.findOne(id, outletId); // validates tenant and outlet scope

    const oldStatus = invoice.status;
    const newStatus = dto.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update Invoice
      const inv = await tx.invoice.update({
        where: { id },
        data: {
          ...(newStatus && { status: newStatus }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });

      // 2. Audit log invoice update
      await this.auditLog.record({
        tenantId,
        action: 'UPDATE',
        entityName: 'Invoice',
        entityId: id,
        newValues: { status: newStatus, notes: dto.notes },
        oldValues: { status: oldStatus, notes: invoice.notes },
      }, tx);

      // 3. Handle status transitions (e.g. to CANCELLED or REFUNDED)
      const isCancelling = (newStatus === 'CANCELLED' || newStatus === 'REFUNDED') && (oldStatus !== 'CANCELLED' && oldStatus !== 'REFUNDED');
      if (isCancelling) {
        // Restore product stock
        for (const item of invoice.items) {
          if (item.productId) {
            const product = await tx.product.findFirst({
              where: { id: item.productId, tenantId },
              select: { id: true, trackStock: true, stockQty: true },
            });
            if (product && product.trackStock) {
              await tx.product.update({
                where: { id: product.id },
                data: { stockQty: product.stockQty + item.quantity },
              });
            }
          }
        }

        // Refund customer spend and visits
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            totalSpend: { decrement: invoice.totalAmount },
            totalVisits: { decrement: 1 },
          },
        });
      }

      return inv;
    });

    return this.posRepo.findByIdWithDetails(id);
  }

  async remove(id: string, outletId?: string): Promise<void> {
    const invoice = await this.findOne(id, outletId); // validates tenant and outlet scope
    await this.posRepo.delete(id);
    await this.auditLog.record({
      tenantId: invoice.tenantId,
      action: 'DELETE',
      entityName: 'Invoice',
      entityId: id,
      oldValues: invoice,
    });
  }
}
