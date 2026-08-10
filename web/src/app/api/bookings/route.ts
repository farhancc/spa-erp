import { NextRequest, NextResponse } from "next/server";
import { handleBackendResponse, resolveBackendUrl } from "../helper";

const BACKEND_URL = resolveBackendUrl("/bookings");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || (tenantSlug ? request.cookies.get(`customer_session_${tenantSlug}`)?.value : "")
    || "";

  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  try {
    const res = await fetch(`${BACKEND_URL}?${searchParams}`, {
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
      { error: errText || "Failed to fetch bookings from backend" },
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
  const allCookies = request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`);
  console.log("=== DEBUG POST /api/bookings ===");
  console.log("tenantSlug:", tenantSlug);
  console.log("All cookies received:", allCookies);

  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || (tenantSlug ? request.cookies.get(`customer_session_${tenantSlug}`)?.value : "")
    || "";

  console.log("Extracted token (truncated):", token ? `${token.substring(0, 15)}... [length: ${token.length}]` : "EMPTY");
  const body = await request.json();

  try {
    console.log("Sending fetch to backend URL:", BACKEND_URL);
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", res.status);
    if (res.ok) {
      console.log("Backend response is OK");
      return handleBackendResponse(res);
    }
    
    const errText = await res.text();
    console.log("Backend error response text:", errText);
    let parsedErr: any = {};
    try {
      parsedErr = JSON.parse(errText);
    } catch {}

    return NextResponse.json(
      { error: parsedErr.message || errText || "Failed to create booking on backend" },
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
