import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/products/purchase-orders");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  try {
    const res = await fetch(`${BACKEND_URL}/all`, {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch purchase orders" });
  } catch (e) {
    console.error("Backend offline. Purchase orders fetch failed:", e);
    return backendUnavailable("Purchase orders fetch");
  }
}

export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to create purchase order" });
  } catch (e) {
    console.error("Backend offline. Purchase order creation failed:", e);
    return backendUnavailable("Purchase order creation");
  }
}

export async function PATCH(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");
  const body = await request.json(); // expects { status }

  if (!id) {
    return NextResponse.json({ error: "Purchase Order ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to update purchase order status" });
  } catch (e) {
    console.error("Backend offline. Purchase order status update failed:", e);
    return backendUnavailable("Purchase order status update");
  }
}
