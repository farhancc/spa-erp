import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SUPERADMIN_SESSION_SECRET =
  process.env.SUPERADMIN_SESSION_SECRET ||
  process.env.JWT_SECRET ||
  "superadmin-secret-fallback";

const COOKIE_NAME = "superadmin_session";
const BACKEND_URL = process.env.BACKEND_API_URL
  ? `${process.env.BACKEND_API_URL}/superadmin/demo-bookings`
  : "http://localhost:3001/api/v1/superadmin/demo-bookings";

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

// GET /api/demo-bookings → list all (protected for superadmins)
export async function GET(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(BACKEND_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: "Failed to fetch from backend" }, { status: res.status });
  } catch (e: any) {
    console.error("Backend proxy GET demo-bookings fetch error:", e.message);
    return NextResponse.json(
      { error: "Database and backend services are temporarily offline." },
      { status: 503 }
    );
  }
}

// POST /api/demo-bookings → create a new demo booking (publicly accessible)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      // NestJS returns { success, data: booking, timestamp } — forward just the booking
      return NextResponse.json({ ok: true, data: data?.data ?? data });
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.message || "Failed to create demo booking" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend proxy POST demo-bookings fetch error:", e.message);
    return NextResponse.json(
      { error: "Database and backend services are temporarily offline." },
      { status: 503 }
    );
  }
}

// DELETE /api/demo-bookings?id=foo (protected for superadmins)
export async function DELETE(request: NextRequest) {
  if (!isSuperAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      return NextResponse.json({ ok: true });
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.message || "Failed to delete demo booking" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend proxy DELETE demo-bookings fetch error:", e.message);
    return NextResponse.json(
      { error: "Database and backend services are temporarily offline." },
      { status: 503 }
    );
  }
}
