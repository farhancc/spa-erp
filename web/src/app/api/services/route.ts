import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../helper";

const BACKEND_URL = resolveBackendUrl("/services");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const all = request.nextUrl.searchParams.get("all") || "true";
  const outletId = request.nextUrl.searchParams.get("outletId");

  try {
    let url = `${BACKEND_URL}?all=${all}`;
    if (outletId) {
      url += `&outletId=${outletId}`;
    }
    const res = await fetch(url, {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch services" });
  } catch (e) {
    console.error("Backend offline. Service list fetch failed:", e);
    return backendUnavailable("Service list fetch");
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to create service" });
  } catch (e) {
    console.error("Backend offline. Service creation failed:", e);
    return backendUnavailable("Service creation");
  }
}

export async function PATCH(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const body = await request.json();
  const { id, ...rest } = body;

  if (!id) {
    return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json", 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(rest),
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to update service" });
  } catch (e) {
    console.error("Backend offline. Service update failed:", e);
    return backendUnavailable("Service update");
  }
}

export async function DELETE(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "DELETE",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to delete service" });
  } catch (e) {
    console.error("Backend offline. Service deletion failed:", e);
    return backendUnavailable("Service deletion");
  }
}
