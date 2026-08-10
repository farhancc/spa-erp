import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/products/suppliers");

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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch suppliers" });
  } catch (e) {
    console.error("Backend offline. Suppliers fetch failed:", e);
    return backendUnavailable("Suppliers fetch");
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to create supplier" });
  } catch (e) {
    console.error("Backend offline. Supplier creation failed:", e);
    return backendUnavailable("Supplier creation");
  }
}

export async function PATCH(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");
  const body = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to update supplier" });
  } catch (e) {
    console.error("Backend offline. Supplier update failed:", e);
    return backendUnavailable("Supplier update");
  }
}

export async function DELETE(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "DELETE",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to delete supplier" });
  } catch (e) {
    console.error("Backend offline. Supplier deletion failed:", e);
    return backendUnavailable("Supplier deletion");
  }
}
