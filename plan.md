# Careva SaaS Architecture & Build Plan

## Vision

Build a multi-tenant salon/spa/grooming SaaS platform focused on:

- Booking management
- CRM
- POS
- Customer retention
- Loyalty points
- Coupons
- Multi-outlet management
- Dynamic branded websites
- WhatsApp engagement
- Structured CMS

This is NOT a full enterprise ERP.

---

# Core Product Areas

## 1. Public Booking Websites

Example:
- tenant.careva.in
- tenant.careva.in/calicut

Features:
- Dynamic pages
- Outlet-specific content
- Booking flow
- Loyalty display
- Coupons/offers
- Customer account area

---

## 2. ERP Dashboard

Example:
- tenant.careva.in/admin

Features:
- CRM
- POS
- Bookings
- Staff
- Reports
- Website builder
- Coupon management
- Loyalty management
- WhatsApp management

---

## 3. Super Admin

Example:
- careva.in/superadmin

Features:
- Tenant management
- Plans
- Subscription management
- Feature flags
- Usage monitoring

---

# Tech Stack

## Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- Zustand (optional)

## Backend
- NestJS
- TypeScript

## Database
- PostgreSQL

## ORM
- Prisma

## Queue
- BullMQ

## Cache / Queue Store
- Redis

## Media Storage
- Cloudinary

## WhatsApp
- whatsapp-web.js initially

---

# Architecture Principles

## Use Modular Monolith

DO NOT use:
- Microservices
- Kubernetes
- CQRS
- Event sourcing

Use:
- Domain-driven modules
- Internal event-driven architecture

---

# Multi-Tenant Architecture

Use:
- Shared database
- tenantId-based isolation

Every business table must contain:
- tenantId

Most business tables should contain:
- outletId

---

# Backend Architecture

## Folder Structure

```txt
src/
│
├── core/
│   ├── auth/
│   ├── tenancy/
│   ├── permissions/
│   ├── events/
│   ├── queues/
│   ├── database/
│   ├── config/
│   └── logger/
│
├── modules/
│   ├── tenant/
│   ├── outlet/
│   ├── user/
│   ├── customer/
│   ├── booking/
│   ├── service/
│   ├── pos/
│   ├── invoice/
│   ├── loyalty/
│   ├── coupon/
│   ├── reports/
│   ├── notification/
│   ├── whatsapp/
│   ├── cms/
│   ├── website/
│   ├── media/
│   └── analytics/
│
├── shared/
│   ├── dto/
│   ├── types/
│   ├── constants/
│   ├── interfaces/
│   └── utils/
│
└── main.ts
```

---

# Frontend Architecture

```txt
src/
│
├── app/
│
├── core/
│   ├── api/
│   ├── auth/
│   ├── tenancy/
│   ├── providers/
│   ├── hooks/
│   └── layouts/
│
├── modules/
│   ├── booking/
│   ├── crm/
│   ├── pos/
│   ├── loyalty/
│   ├── coupon/
│   ├── website/
│   ├── cms/
│   ├── reports/
│   └── whatsapp/
│
├── shared/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── utils/
│
└── styles/
```

---

# Authentication

Use:
- JWT
- HTTP-only cookies
- bcrypt

Roles:
- SUPER_ADMIN
- OWNER
- MANAGER
- RECEPTIONIST
- STYLIST

JWT must contain:
- userId
- tenantId
- role

---

# Multi-Tenant Routing

## Public Website
- tenant.careva.in

## ERP
- tenant.careva.in/admin

## Customer Portal
- tenant.careva.in/account

## Super Admin
- careva.in/superadmin

---

# Local Development

Use:
- lvh.me

Examples:
- cutsalon.lvh.me:3000
- luxcuts.lvh.me:3000

---

# CMS / Website Builder

## IMPORTANT

Do NOT build free-form drag-drop builder.

Use:
- structured section-based CMS

---

# Section System

Each page contains sections.

Example:

```json
[
  {
    "type": "hero",
    "data": {}
  },
  {
    "type": "services",
    "data": {}
  }
]
```

---

# Allowed Operations

Website owners can:
- Add sections
- Remove sections
- Reorder sections
- Edit section content
- Enable/disable sections

---

# Website Templates

Provide templates:
- Luxury salon
- Minimal
- Spa
- Barber

Tenant customizes:
- colors
- images
- content
- offers
- gallery

---

# Outlet-Specific Content

Each outlet can have:
- Different offers
- Different banners
- Different gallery
- Different pricing
- Different staff
- Different timings

---

# Core Modules

## Booking
- Appointment creation
- Reschedule
- Cancel
- Staff assignment
- Slot management

---

## CRM
- Customer history
- Visit timeline
- Notes
- Preferred stylist
- Repeat customer tracking

---

## POS
- Service billing
- Product billing
- Discounts
- GST basic support
- Payment methods
- Invoice generation

---

## Loyalty
- Earn points
- Redeem points
- Reward history
- Point expiry

---

## Coupons
- Flat discount
- Percentage discount
- Outlet-specific offers
- Birthday coupons
- First booking coupons

---

## Reports
- Daily revenue
- Outlet performance
- Staff performance
- Repeat customers
- Booking analytics

---

# WhatsApp System

## Initial Version
Use:
- whatsapp-web.js

Each tenant:
- Separate session
- Separate number

---

# WhatsApp Features
- OTP
- Booking confirmation
- Booking reminder
- Birthday offers
- Rebooking reminders

---

# Queue Architecture

Use:
- BullMQ
- Redis

Queues:
- notification-queue
- whatsapp-queue

---

# Event-Driven Flow

Example:

```txt
Booking Created
↓
Emit Event
↓
Notification Module
↓
WhatsApp Queue
↓
Worker Sends Message
```

---

# Important Engineering Rules

## NEVER
- Put business logic in controllers
- Directly couple modules
- Call WhatsApp directly from booking module
- Use giant service files

---

## ALWAYS
- Use service layer
- Use event-driven communication
- Use repository pattern
- Keep modules isolated

---

# Suggested Build Order

## Phase 1
- Multi-tenant foundation
- Auth
- Tenant routing
- Database setup

---

## Phase 2
- Booking system
- CRM
- Staff management

---

## Phase 3
- POS
- Invoices
- Reports

---

## Phase 4
- Website builder
- CMS sections
- Templates

---

## Phase 5
- Loyalty
- Coupons
- Customer accounts

---

## Phase 6
- WhatsApp integration
- Queue system
- Retention automation

---

# Future Expansion

Possible future modules:
- Memberships
- Inventory
- AI recommendations
- Referrals
- Email campaigns
- Official WhatsApp APIs

Architecture should support adding modules without modifying existing core modules heavily.

---

# Product Direction

This product is:
- Operational SaaS
- CRM + Booking + Retention platform
- Multi-outlet management system
- Structured website platform

This is NOT:
- Full accounting ERP
- Payroll software
- Enterprise ERP
- Shopify clone
