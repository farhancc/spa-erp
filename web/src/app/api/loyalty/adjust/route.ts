import { NextRequest, NextResponse } from "next/server";
import { handleBackendResponse, resolveBackendUrl } from "../../helper";

export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || "";
  const { searchParams } = request.nextUrl;
  const customerId = searchParams.get("customerId");
  const body = await request.json();

  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  const backendUrl = resolveBackendUrl(`/loyalty/account/${customerId}/adjust`);

  try {
    const res = await fetch(backendUrl, {
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
  } catch (e) {
    console.warn("Backend offline. Loyalty points adjustment failed.");
  }

  return NextResponse.json({ error: "Adjustment failed" }, { status: 500 });
}
