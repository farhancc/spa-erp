# Careva SaaS — Complete Project Audit Report
> Generated: 2026-05-27 | Scope: Full stack (NestJS backend + Next.js frontend)

---

## Executive Summary

The project has a **very strong architectural foundation** on the backend side, but the frontend is currently operating as an **entirely disconnected prototype** built on localStorage. The two halves do not communicate at all. This is the central risk. Below is every issue categorized by severity.

---

## 🔴 CRITICAL — Will Break in Production

### 1. Frontend & Backend Are 100% Disconnected

**The entire Next.js frontend makes zero API calls to the NestJS backend.**

Every operation — login, signup, bookings, POS checkout, CRM, WhatsApp — reads/writes from `localStorage` or a local JSON file (`tenants-db.json`). The NestJS backend (port 3001) is a completely separate, unused system.

- **Admin login** checks `localStorage.getItem("owner_admin_session_luxcuts")` not a JWT
- **Customer login** checks plain passwords stored in `localStorage` (no hashing)
- **Bookings** are created in `localStorage`, not in the SQLite DB
- **Invoices** are generated in memory, not persisted
- **WhatsApp** is entirely simulated with fake timeouts

**Risk:** Move any tenant to a new browser / device and everything is gone.

---

### 2. Passwords Stored in Plaintext

In multiple places, passwords are stored in plain text:

**Frontend signup** (`tenant/[tenantSlug]/signup/page.tsx`, line 290):
```js
const newCustomer = { password, ... };
localStorage.setItem(storedKey, JSON.stringify(currentCustomers));
```

**Tenant DB** (`tenants-db.json`):
```json
{ "ownerPassword": "luxcuts@123" }
```

**SuperAdmin check** (`superadmin/page.tsx`, line 143):
```js
if (loginEmail === "admin@careva.in" && loginPassword === "password123")
```

**Risk:** Any user who opens DevTools → Application → localStorage can see all passwords in plaintext.

---

### 3. No Real Authentication Guard on Admin Route

The admin page (`tenant/[tenantSlug]/admin/page.tsx`) **has no access control check**. There is no middleware or guard that prevents unauthenticated access. Anyone can navigate to `/tenant/luxcuts/admin` and see the full dashboard.

The only "check" that exists is the SuperAdmin page redirecting to `/login` if `localStorage.getItem("super_admin_logged_in") !== "true"` — which anyone can set in DevTools.

---

### 4. WhatsApp Integration Is Completely Fake

The WhatsApp module (`src/modules/whatsapp/whatsapp.module.ts`) is a **stub with no implementation**:
```ts
@Module({})
export class WhatsappModule {}
```

The frontend generates a QR code using `api.qrserver.com` (a 3rd party QR image API) — this is not a real WhatsApp Web connection. `simulateDeviceScan()` just runs a 2-second `setTimeout` and sets a flag in `localStorage`.

The backend `BookingNotificationHandler` enqueues WhatsApp jobs into BullMQ — but there is **no BullMQ worker** that processes those jobs. The jobs sit in the Redis queue forever.

---

### 5. Redis Dependency with No Fallback

The backend requires a running Redis instance (for BullMQ). The `.env` has `REDIS_HOST=localhost` but Redis is unlikely to be running locally during development. The app will fail to start or silently fail to send notifications if Redis is unavailable.

---

### 6. TenantContextService Will Throw on Most Backend Requests

`TenantContextService.tenantId` throws if not initialized:
```ts
get tenantId(): string {
  if (!this._tenantId) {
    throw new Error('TenantContext not initialized — check TenantMiddleware')
  }
}
```

The middleware **skips** tenant resolution if no subdomain is present and no `X-Tenant-Slug` header is set. Since the frontend makes no API calls, this hasn't been caught — but the moment you try to call any backend endpoint from `localhost:3000` without a subdomain or the header, every request to a service using `tenantCtx.tenantId` will throw a 500 error.

---

### 7. Cross-Tenant Data Leakage Risk in localStorage

All localStorage keys use the `tenantSlug` as a namespace, but this is **easily bypassable** — e.g., a user on `luxcuts` could directly read `tenant_customers_groombarber` with JS. More critically, the tenants-db.json API (`/api/tenants`) is a **public unauthenticated endpoint** that returns all tenants including their `ownerPassword` fields.

---

## 🟠 HIGH — Architectural Problems

### 8. Most Backend Modules Are Empty Stubs

These modules are registered in `app.module.ts` but contain zero implementation:

| Module | Status |
|---|---|
| `WhatsappModule` | Empty stub |
| `PosModule` | Empty stub |
| `ReportsModule` | Empty stub |
| `CmsModule` | Empty stub |
| `MediaModule` | Empty stub |
| `TenantModule` | Empty stub (only `{dto}` folder) |
| `UserModule` | Empty stub (only `{dto}` folder) |

Only `BookingModule` has a real service, repository, controller, and events. Everything else is a placeholder.

---

### 9. The `any` Type Is Overused Throughout

The frontend admin page (5182 lines) uses `any` in dozens of places:
```ts
const [whatsAppLogs, setWhatsAppLogs] = useState<any[]>([]);
const [whatsAppTemplates, setWhatsAppTemplates] = useState<any[]>([]);
const [cmsOutlets, setCmsOutlets] = useState<any[]>([]);
const [sections, setSections] = useState<any[]>([]);
const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
```

This bypasses TypeScript's safety, making refactoring dangerous and bugs harder to catch.

---

### 10. Admin Page is a 5,182-Line Monolith

The entire admin dashboard is one single file (`admin/page.tsx`) at **305KB**. This includes:
- POS (checkout, cart, invoices)
- CRM (customer management, notes)
- Bookings calendar
- Services & Products CRUD
- Subscription management
- Coupon management
- WhatsApp CRM gateway
- CMS/Website builder
- Reports
- Schedule management

This is unmaintainable. It should be split into separate route segments or component files.

---

### 11. Frontend-Only "Database" Will Not Scale

The `tenants-db.json` file is used as the persistence layer for all tenant data in the Next.js frontend. This:
- **Won't work** if the app is deployed on a serverless platform (Vercel, Cloudflare) as the filesystem is read-only
- **Won't scale** — concurrent writes will corrupt the file (no locking)
- **Has no backup mechanism**

---

### 12. SQLite Is Not Suitable for Production Multi-Tenancy

The schema comment says "SQLite Version for Local Dev" — but there's no PostgreSQL version present. Many schema comments say things like `// SQLite: Changed Json to String`. SQLite:
- Doesn't support concurrent writes properly (WAL mode helps but isn't configured)
- Doesn't support the `Decimal` type (all prices are `Float`, prone to floating-point errors)
- Is not suitable for a hosted SaaS

---

### 13. No Birthday Job Scheduler Exists

The `CustomerBirthdayEvent` domain event is defined and the handler queues a `SEND_BIRTHDAY_OFFER` BullMQ job. However, **there is no cron/scheduler** that actually detects birthdays and emits this event. Nothing fires `CustomerBirthdayEvent`.

---

### 14. CORS Is Too Restrictive for Real Multi-Tenant Use

CORS is configured to only allow `http://localhost:3000`. For subdomain-based tenancy (e.g., `elegantcurls.careva.in`), each subdomain needs to be allowed. Currently, any cross-origin request from a tenant subdomain would fail.

```ts
// current:
origins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',')
// needed:
origin: (origin, callback) => callback(null, origin?.endsWith('.careva.in') || origin === 'http://localhost:3000')
```

---

### 15. No Refresh Token Strategy

The JWT strategy uses a 7-day token with no refresh token mechanism. Once a token expires, the user is logged out with no way to silently refresh. For a salon operations tool (used throughout the day), this is disruptive.

---

## 🟡 MEDIUM — Missing Features / Incomplete Logic

### 16. Plan Feature Gating Not Enforced

The `Plan` model has flags like `whatsappEnabled`, `loyaltyEnabled`, `couponsEnabled`. The WhatsApp gateway tab and loyalty features are visible to all tenants in the admin panel regardless of their plan. **No plan-based feature gating is implemented** anywhere in the frontend or backend.

---

### 17. No Real OTP Delivery

The OTP shown on signup (`handleSignUp` in signup page) is:
1. Generated client-side (not server-side)
2. Stored in React state (can be read with React DevTools)
3. Never actually sent via WhatsApp — only a `localStorage` log entry is created

Anyone can bypass OTP verification by checking the `generatedOtp` state variable.

---

### 18. No Media Upload Implementation

The `MediaModule` stub and `MediaAsset` Prisma model suggest Cloudinary integration was planned. The `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` env vars are empty. Logo URL fields accept raw URL strings typed by the user — there's no file upload UI.

---

### 19. Reports Tab Has No Real Data

The Reports tab shows hardcoded dummy data. It doesn't read from `localStorage` bookings/invoices, let alone from a database. Revenue figures shown are static mock values.

---

### 20. No Input Validation on Frontend Forms

Forms throughout the app lack validation:
- Phone numbers accept any string (no format check)
- Prices accept any number (no min/max)
- Coupon codes accept any string (no uniqueness check before save)
- Service duration is not captured during creation

---

### 21. `stealthNaturalHours` Toggle Has No Effect

The "Quiet Hours Guard" (9PM-9AM) toggle in the WhatsApp Stealth panel saves to `localStorage` but no code checks this value before dispatching messages. Both the simulation and any future real dispatch would ignore it.

---

### 22. Superadmin "System Activity" Logs Are Hardcoded

The system activity log in the SuperAdmin dashboard shows hardcoded fake timestamps from May 2026. No real logging is collected or displayed.

---

### 23. Missing: Password Hashing

The backend `User` model has a `passwordHash` field, and `bcrypt` should be used. But the frontend creates users with plain text `password` fields and the comparison is `found.password !== password` — no hash, no salt.

---

## 🟢 WHAT'S DONE WELL

The backend architecture is genuinely solid for its scope:

| Strength | Detail |
|---|---|
| **Domain Events** | Clean `EventEmitter2` decoupling between modules |
| **Tenant Isolation** | `TenantContextService` (REQUEST scoped) is the right pattern |
| **Global Guards** | Auth → RBAC → Rate Limit chain is correctly ordered |
| **Repository Pattern** | `BaseRepository<TModel>` is clean and reusable |
| **Swagger** | Auto-generated docs wired up properly |
| **Prisma Schema** | Well-structured with proper relations and indexes |
| **BullMQ** | Correct retry/backoff configuration, centralized queue registry |
| **Exception Filter** | Global handler with stack trace in dev, sanitized in prod |
| **CORS + Cookie Auth** | Dual extraction (cookie + Bearer) is good for web+mobile |
| **WhatsApp schema** | `WhatsAppSession` + `WhatsAppMessage` models are production-ready |
| **Frontend UI** | Very polished glassmorphic design, consistent theming across 4 templates |

---

## Priority Action Plan

### Phase 1 — Security (Do First)
1. Hash all passwords with `bcrypt` — both at rest and on comparison
2. Add a route guard on the admin page (check `localStorage` session AND backend JWT)
3. Remove `ownerPassword` from the `tenants-db.json` API response
4. Move the superadmin credential to an env variable

### Phase 2 — Backend Connection (Core Work)
5. Implement `AuthModule` login/signup endpoints
6. Connect the frontend admin login to the backend JWT auth endpoint
7. Implement `PosModule` — checkout and invoice persistence
8. Implement `WhatsappModule` with `whatsapp-web.js` (already in `node_modules`)
9. Add a BullMQ worker for the WHATSAPP queue
10. Implement `ReportsModule` with Prisma aggregation queries

### Phase 3 — Architecture Cleanup
11. Split `admin/page.tsx` into tab-specific components/routes
12. Replace all `any` types with proper TypeScript interfaces
13. Migrate tenant data from `tenants-db.json` to the Prisma/SQLite DB
14. Add a cron job for birthday event emission

### Phase 4 — Production Readiness
15. Add PostgreSQL support and migrate schema (remove `@default(cuid())` for UUID)
16. Configure CORS to allow `*.careva.in` subdomains
17. Implement refresh token rotation
18. Add Cloudinary file upload for media/logos
19. Enforce plan-based feature gating in both frontend and backend
20. Add a proper Redis health check and retry strategy
