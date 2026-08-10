// ============================================================
// Careva SaaS — Enums
// Defined in TypeScript for SQLite database support
// ============================================================

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  STYLIST = 'STYLIST',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
  LOYALTY_POINTS = 'LOYALTY_POINTS',
  COUPON = 'COUPON',
}

export enum CouponType {
  FLAT = 'FLAT',
  PERCENTAGE = 'PERCENTAGE',
}

export enum CouponTrigger {
  MANUAL = 'MANUAL',
  BIRTHDAY = 'BIRTHDAY',
  FIRST_BOOKING = 'FIRST_BOOKING',
  REFERRAL = 'REFERRAL',
}

export enum LoyaltyTxType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
}

export enum SectionType {
  HERO = 'HERO',
  SERVICES = 'SERVICES',
  GALLERY = 'GALLERY',
  TESTIMONIALS = 'TESTIMONIALS',
  TEAM = 'TEAM',
  OFFERS = 'OFFERS',
  BOOKING_CTA = 'BOOKING_CTA',
  CONTACT = 'CONTACT',
  FAQ = 'FAQ',
  ABOUT = 'ABOUT',
  CUSTOM_HTML = 'CUSTOM_HTML',
}

export enum WebsiteTemplate {
  LUXURY = 'LUXURY',
  MINIMAL = 'MINIMAL',
  SPA = 'SPA',
  BARBER = 'BARBER',
}

export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum GstType {
  INCLUSIVE = 'INCLUSIVE',
  EXCLUSIVE = 'EXCLUSIVE',
  NONE = 'NONE',
}
