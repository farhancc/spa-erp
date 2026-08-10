/**
 * Domain Events Registry
 *
 * All cross-module events are defined here as typed classes.
 * Modules emit events; other modules listen — no direct imports between them.
 *
 * Naming convention: <domain>.<action>
 * e.g. 'booking.created', 'invoice.paid', 'customer.birthday'
 *
 * To add events for a new module (e.g. inventory):
 *   1. Define the event class below
 *   2. Emit via EventBus in the source module
 *   3. Listen via @OnEvent() in any handler
 */

// ─── Booking Events ──────────────────────────────────────────────────────────

export class BookingCreatedEvent {
  static readonly EVENT = 'booking.created';
  constructor(
    public readonly tenantId: string,
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly outletId: string,
    public readonly scheduledAt: Date,
    public readonly staffId?: string,
  ) {}
}

export class BookingCancelledEvent {
  static readonly EVENT = 'booking.cancelled';
  constructor(
    public readonly tenantId: string,
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly reason?: string,
  ) {}
}

export class BookingCompletedEvent {
  static readonly EVENT = 'booking.completed';
  constructor(
    public readonly tenantId: string,
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly outletId: string,
  ) {}
}

// ─── Invoice / POS Events ────────────────────────────────────────────────────

export class InvoicePaidEvent {
  static readonly EVENT = 'invoice.paid';
  constructor(
    public readonly tenantId: string,
    public readonly invoiceId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly loyaltyPointsEarned: number,
  ) {}
}

// ─── Customer Events ─────────────────────────────────────────────────────────

export class CustomerCreatedEvent {
  static readonly EVENT = 'customer.created';
  constructor(
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly phone: string,
  ) {}
}

export class CustomerBirthdayEvent {
  static readonly EVENT = 'customer.birthday';
  constructor(
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly phone: string,
    public readonly name: string,
  ) {}
}

// ─── WhatsApp Events ─────────────────────────────────────────────────────────

export class WhatsappMessageReceivedEvent {
  static readonly EVENT = 'whatsapp.message.received';
  constructor(
    public readonly tenantId: string,
    public readonly from: string,
    public readonly body: string,
    public readonly sessionId: string,
  ) {}
}

// ─── Inventory Events ────────────────────────────────────────────────────────

export class ProductOutOfStockEvent {
  static readonly EVENT = 'inventory.product.outofstock';
  constructor(
    public readonly tenantId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly sku: string | null,
    public readonly outletId: string | null,
  ) {}
}

export class ProductLowStockEvent {
  static readonly EVENT = 'inventory.product.lowstock';
  constructor(
    public readonly tenantId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly sku: string | null,
    public readonly outletId: string | null,
    public readonly oldQty: number,
    public readonly newQty: number,
  ) {}
}

