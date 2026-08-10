export const QUEUE_NAMES = {
  NOTIFICATION: 'notification-queue',
  WHATSAPP: 'whatsapp-queue',
  REPORT: 'report-queue',
  // Add new queues here as needed (e.g. INVENTORY: 'inventory-queue')
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ─── Job Types per Queue ──────────────────────────────────────────────────────

export const NOTIFICATION_JOBS = {
  SEND_WHATSAPP: 'send-whatsapp',
  SEND_SMS: 'send-sms',
  SEND_EMAIL: 'send-email',
} as const;

export const WHATSAPP_JOBS = {
  SEND_MESSAGE: 'send-message',
  SEND_OTP: 'send-otp',
  SEND_BOOKING_CONFIRMATION: 'send-booking-confirmation',
  SEND_REMINDER: 'send-reminder',
  SEND_BIRTHDAY_OFFER: 'send-birthday-offer',
} as const;
