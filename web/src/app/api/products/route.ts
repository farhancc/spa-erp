import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../helper";

const BACKEND_URL = resolveBackendUrl("/products");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const all = request.nextUrl.searchParams.get("all") || "true";
  const outletId = request.nextUrl.searchParams.get("outletId");

  try {
    let url = `${BACKEND_URL}?all=${all}`;
    if (outletId) url += `&outletId=${outletId}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch products" });
  } catch (e) {
    console.error("Backend offline. Product list fetch failed:", e);
    return backendUnavailable("Product list fetch");
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to create product" });
  } catch (e) {
    console.error("Backend offline. Product creation failed:", e);
    return backendUnavailable("Product creation");
  }
}

export async function PATCH(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");
  const body = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to update product" });
  } catch (e) {
    console.error("Backend offline. Product update failed:", e);
    return backendUnavailable("Product update");
  }
}

export async function DELETE(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "DELETE",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to delete product" });
  } catch (e) {
    console.error("Backend offline. Product deletion failed:", e);
    return backendUnavailable("Product deletion");
  }
}
