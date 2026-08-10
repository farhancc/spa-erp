import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/users/leaves");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch leaves" });
  } catch (e) {
    console.error("Backend offline. Leaves fetch failed:", e);
    return backendUnavailable("Leaves fetch");
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to create leave" });
  } catch (e) {
    console.error("Backend offline. Leave creation failed:", e);
    return backendUnavailable("Leave creation");
  }
}

export async function DELETE(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Leave ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "DELETE",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to delete leave" });
  } catch (e) {
    console.error("Backend offline. Leave deletion failed:", e);
    return backendUnavailable("Leave deletion");
  }
}
