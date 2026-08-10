import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductLowStockEvent } from '../../../core/events/domain-events';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class LowStockReorderHandler {
  private readonly logger = new Logger(LowStockReorderHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(ProductLowStockEvent.EVENT)
  async handleProductLowStock(event: ProductLowStockEvent) {
    try {
      this.logger.log(
        `Received inventory.product.lowstock event for product ID: ${event.productId} (tenant: ${event.tenantId}, oldQty: ${event.oldQty}, newQty: ${event.newQty})`
      );

      // 1. Fetch the product to verify supplier association
      const product = await this.prisma.product.findUnique({
        where: { id: event.productId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          costPrice: true,
          lowStockThreshold: true,
          supplierId: true,
        },
      });

      if (!product) {
        this.logger.warn(`Product with ID ${event.productId} not found in database.`);
        return;
      }

      if (!product.supplierId) {
        this.logger.log(
          `Product ${product.name} crossed low-stock threshold but has no supplier assigned. Skipping automatic draft PO creation.`
        );
        return;
      }

      // Reorder quantity calculation:
      // We will order at least 10 items or (threshold * 2) - whichever is higher.
      const reorderQty = Math.max(10, product.lowStockThreshold * 2);
      const itemCost = Number(product.costPrice) || 0;

      // 2. Query for an existing DRAFT Purchase Order for this tenant & supplier
      const existingDraftPo = await this.prisma.purchaseOrder.findFirst({
        where: {
          tenantId: product.tenantId,
          supplierId: product.supplierId,
          status: 'DRAFT',
        },
        include: { items: true },
      });

      if (existingDraftPo) {
        this.logger.log(
          `Found existing DRAFT Purchase Order (ID: ${existingDraftPo.id}) for supplier ${product.supplierId}. Appending item.`
        );

        // Check if product is already in the draft PO
        const existingItem = existingDraftPo.items.find((item) => item.productId === product.id);

        if (existingItem) {
          // If it already exists, update its quantity if the recommended reorder quantity is higher
          const updatedQty = Math.max(existingItem.quantity, reorderQty);
          await this.prisma.purchaseOrderItem.update({
            where: { id: existingItem.id },
            data: { quantity: updatedQty },
          });
        } else {
          // Otherwise, create a new item in this DRAFT PO
          await this.prisma.purchaseOrderItem.create({
            data: {
              purchaseOrderId: existingDraftPo.id,
              productId: product.id,
              quantity: reorderQty,
              costPrice: itemCost,
            },
          });
        }

        // Recalculate total amount of the DRAFT PO
        const allItems = await this.prisma.purchaseOrderItem.findMany({
          where: { purchaseOrderId: existingDraftPo.id },
        });
        const newTotal = allItems.reduce(
          (sum, it) => sum + Number(it.costPrice) * it.quantity,
          0
        );

        await this.prisma.purchaseOrder.update({
          where: { id: existingDraftPo.id },
          data: {
            totalAmount: newTotal,
            notes: `Auto-updated: Low stock threshold crossed for ${product.name} (Stock: ${event.newQty}).`,
          },
        });
      } else {
        this.logger.log(
          `No existing DRAFT Purchase Order found for supplier ${product.supplierId}. Generating a new one.`
        );

        // Create new DRAFT PO
        const total = reorderQty * itemCost;
        await this.prisma.purchaseOrder.create({
          data: {
            tenantId: product.tenantId,
            supplierId: product.supplierId,
            status: 'DRAFT',
            totalAmount: total,
            notes: `Auto-generated draft PO: Low stock threshold crossed for ${product.name} (Stock: ${event.newQty}).`,
            items: {
              create: [
                {
                  productId: product.id,
                  quantity: reorderQty,
                  costPrice: itemCost,
                },
              ],
            },
          },
        });
      }

      this.logger.log(`Successfully generated/updated draft PO for product reorder recommendation: ${product.name}`);
    } catch (err) {
      this.logger.error(`Failed to generate draft PO recommendation: ${err.message}`, err.stack);
    }
  }
}
