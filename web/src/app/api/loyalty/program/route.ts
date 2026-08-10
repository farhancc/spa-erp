import { NextRequest, NextResponse } from "next/server";
import { handleBackendResponse, resolveBackendUrl } from "../../helper";

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || "";

  const backendUrl = resolveBackendUrl(`/loyalty/program`);

  try {
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return handleBackendResponse(res);
  } catch (e) {
    console.warn("Backend offline. Failed to fetch loyalty program.");
  }

  return NextResponse.json({ error: "Failed to fetch loyalty program" }, { status: 500 });
}

export async function PATCH(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || "";
  const body = await request.json();

  const backendUrl = resolveBackendUrl(`/loyalty/program`);

  try {
    const res = await fetch(backendUrl, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    return handleBackendResponse(res);
  } catch (e) {
    console.warn("Backend offline. Failed to update loyalty program.");
  }

  return NextResponse.json({ error: "Failed to update loyalty program" }, { status: 500 });
}
