import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SUPERADMIN_SESSION_SECRET =
  process.env.SUPERADMIN_SESSION_SECRET ||
  process.env.JWT_SECRET ||
  "superadmin-secret-fallback";

const COOKIE_NAME = "superadmin_session";
const BACKEND_URL = process.env.BACKEND_API_URL
  ? `${process.env.BACKEND_API_URL}/superadmin/tenants`
  : "http://localhost:3001/api/v1/superadmin/tenants";

function isSuperAdminRequest(request: NextRequest): boolean {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    const decoded = jwt.verify(token, SUPERADMIN_SESSION_SECRET) as any;
    return decoded && decoded.role === "SUPERADMIN";
  } catch {
    return false;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "careva-fallback-secret";

function isTenantAdminRequest(request: NextRequest, slug: string): boolean {
  try {
    const cookieName = `admin_session_${slug}`;
    const token = request.cookies.get(cookieName)?.value;
    if (!token) return false;
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded && decoded.slug === slug;
  } catch {
    return false;
  }
}

// GET /api/tenants           → list all
// GET /api/tenants?slug=foo  → get one by slug
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  // Protect list-all endpoint: only superadmins can query list of all tenants.
  if (!slug && !isSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = slug ? `${BACKEND_URL}?slug=${slug}` : BACKEND_URL;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      let data = await res.json();
      // Unwrap backend envelope if present
      if (data && typeof data === "object" && "success" in data && "data" in data) {
        data = data.data;
      }

      if (Array.isArray(data)) {
        const sanitizedList = data.map(({ ownerPassword: _pw, ...rest }: any) => rest);
        return NextResponse.json(sanitizedList);
      } else if (data) {
        const { ownerPassword: _pw, ...sanitized } = data;
        return NextResponse.json(sanitized);
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Failed to fetch from backend" }, { status: res.status });
  } catch (e: any) {
    console.error("Backend proxy GET fetch error:", e.message, e.stack);
    return NextResponse.json(
      { error: "Authentication and database services are temporarily offline." },
      { status: 503 }
    );
  }
}

// POST /api/tenants → create/update (upsert by slug)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const tenantSlug = body.slug.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Protect updates: check if tenant already exists.
    // If the tenant exists, we must enforce verified superadmin session authorization.
    let tenantExists = false;
    try {
      const res = await fetch(`${BACKEND_URL}?slug=${tenantSlug}`, { cache: "no-store" });
      if (res.ok) {
        let data = await res.json();
        if (data && typeof data === "object" && "success" in data && "data" in data) {
          data = data.data;
        }
        if (data && data.slug) {
          tenantExists = true;
        }
      }
    } catch {
      // Ignore backend fetch error, default to assuming it doesn't exist to avoid locking out signups
    }

    if (tenantExists && !isSuperAdminRequest(request) && !isTenantAdminRequest(request, tenantSlug)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy the request to the NestJS backend
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), // Forward original body including ownerPassword if provided
    });

    if (res.ok) {
      let data = await res.json();
      // Unwrap backend envelope if present
      if (data && typeof data === "object" && "success" in data && "data" in data) {
        data = data.data;
      }
      const { ownerPassword: _dpw, ...dbDataSafe } = data || {};
      return NextResponse.json({ ok: true, tenant: dbDataSafe });
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.message || "Failed to create/update tenant" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend proxy POST fetch error:", e.message, e.stack);
    return NextResponse.json(
      { error: "Authentication and database services are temporarily offline." },
      { status: 503 }
    );
  }
}

// DELETE /api/tenants?slug=foo
export async function DELETE(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}?slug=${slug}`, { method: "DELETE" });
    if (res.ok) {
      return NextResponse.json({ ok: true });
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.message || "Failed to delete tenant" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend proxy DELETE fetch error:", e.message, e.stack);
    return NextResponse.json(
      { error: "Database and authentication services are temporarily offline." },
      { status: 503 }
    );
  }
}
