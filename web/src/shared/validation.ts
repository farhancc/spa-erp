import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Product name is too long"),
  price: z.number().nonnegative("Selling price must be non-negative"),
  sku: z.string().nullable().optional(),
  stockQty: z.number().int().nonnegative("Stock quantity must be non-negative"),
  trackStock: z.boolean(),
  costPrice: z.number().nonnegative("Cost price must be non-negative"),
  lowStockThreshold: z.number().int().positive("Threshold must be positive"),
  supplierId: z.string().nullable().optional(),
  outletId: z.string().optional().nullable(),
  imageUrl: z.string().nullable().optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required").max(100, "Service name is too long"),
  price: z.number().nonnegative("Price must be non-negative"),
  offerPrice: z.number().nullable().optional(),
  isCombo: z.boolean(),
  comboServiceIds: z.array(z.string()),
  category: z.string().min(1, "Category is required"),
  duration: z.number().int().positive("Duration must be positive"),
  gender: z.enum(["ANY", "MALE", "FEMALE", "UNISEX", "MEN", "WOMEN"]),
  bodyPart: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  loyaltyPoints: z.number().int().nonnegative("Loyalty points must be non-negative"),
  images: z.array(z.string()),
  tags: z.array(z.string()),
  outletId: z.string().optional().nullable(),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  tags: z.string().optional().nullable(),
  loyaltyPoints: z.number().int().nonnegative().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["STYLIST", "MANAGER", "RECEPTIONIST"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").toUpperCase(),
  discountPercent: z.number().min(1, "Discount must be at least 1%").max(100, "Discount cannot exceed 100%"),
  minBill: z.number().nonnegative("Minimum bill must be non-negative").optional().nullable(),
  maxDiscount: z.number().nonnegative("Max discount must be non-negative").optional().nullable(),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

export const bookingSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  serviceName: z.string().min(1, "Service selection is required"),
  stylistName: z.string().min(1, "Stylist selection is required"),
  timeSlot: z.string().min(1, "Booking time is required"),
  date: z.string().min(1, "Booking date is required"),
});
