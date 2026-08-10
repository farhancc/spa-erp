import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Tenant API helpers (server-backed, cross-subdomain) ──────────────────────
// All calls go to /api/tenants on the Next.js server, which is the same
// regardless of which subdomain (lvh.me) the browser is on.
// The server reads/writes a JSON file on disk — truly persistent.

function apiBase() {
  // Use relative URL — works from any subdomain since Next.js handles all of them
  // from the same server process. No CORS issues.
  return "/api/tenants";
}

export async function getSharedTenants(): Promise<any[]> {
  try {
    const res = await fetch(apiBase(), { cache: "no-store" });
    if (res.status === 401) {
      return [];
    }
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    console.error("getSharedTenants failed", e);
    return [];
  }
}

export async function getTenantBySlug(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${apiBase()}?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    console.error("getTenantBySlug failed", e);
    return null;
  }
}

export async function saveSharedTenant(tenant: any): Promise<boolean> {
  try {
    const res = await fetch(apiBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tenant),
    });
    return res.ok;
  } catch (e) {
    console.error("saveSharedTenant failed", e);
    return false;
  }
}

export async function saveSharedTenants(tenants: any[]): Promise<void> {
  // Batch upsert all tenants
  for (const t of tenants) {
    await saveSharedTenant(t);
  }
}

export async function deleteTenantBySlug(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (e) {
    console.error("deleteTenantBySlug failed", e);
    return false;
  }
}

/**
 * Helper to generate correct URLs for tenant pages (storefront, login, signup, etc.)
 * that works correctly in both subdomain routing and path-based routing modes.
 */
export function getTenantHref(slug: string, path: string = ""): string {
  if (typeof window === "undefined") {
    return path || "/";
  }
  const isPathRouting = window.location.pathname.startsWith('/tenant/');
  
  if (isPathRouting) {
    // Path-based routing: /tenant/[slug]/[path]
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/tenant/${slug}${cleanPath === '/' ? '' : cleanPath}`;
  } else {
    // Subdomain routing: /[path]
    return path || "/";
  }
}

// ─── Demo Bookings API helpers ────────────────────────────────────────────────
export async function getDemoBookings(): Promise<any[]> {
  try {
    const res = await fetch("/api/demo-bookings", {
      cache: "no-store",
      credentials: "include",  // forward the superadmin_session cookie
    });
    if (!res.ok) throw new Error(`getDemoBookings: ${res.status}`);
    const json = await res.json();
    // NestJS wraps data as { success, data: [], timestamp }
    return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
  } catch (e) {
    console.error("getDemoBookings failed", e);
    return [];
  }
}

export async function saveDemoBooking(booking: any): Promise<boolean> {
  try {
    const res = await fetch("/api/demo-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    if (!res.ok) return false;
    const json = await res.json();
    // Next.js proxy returns { ok: true, data: {...} }
    return json?.ok === true;
  } catch (e) {
    console.error("saveDemoBooking failed", e);
    return false;
  }
}

export async function deleteDemoBookingById(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/demo-bookings?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (e) {
    console.error("deleteDemoBookingById failed", e);
    return false;
  }
}
