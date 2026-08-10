import { NextRequest, NextResponse } from "next/server";
import { handleBackendResponse } from "../../helper";

const BACKEND_URL = `${process.env.BACKEND_API_URL || "http://localhost:3001/api/v1"}/pos/invoices`;

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || "";
  const { searchParams } = request.nextUrl;

  try {
    const res = await fetch(`${BACKEND_URL}?${searchParams.toString()}`, {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    if (res.ok) {
      return handleBackendResponse(res);
    }
    const errText = await res.text();
    return NextResponse.json(
      { error: errText || "Failed to fetch invoices from backend" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend database connection failed:", e.message);
    return NextResponse.json(
      { error: "Backend database connection failed" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || "";
  const body = await request.json();

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return handleBackendResponse(res);
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.message || "Failed to create invoice on backend" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend database connection failed:", e.message);
    return NextResponse.json(
      { error: "Backend database connection failed" },
      { status: 502 }
    );
  }
}
