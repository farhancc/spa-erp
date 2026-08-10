import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/customers/segments");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");
  const action = request.nextUrl.searchParams.get("action"); // e.g. "members"

  try {
    let url = `${BACKEND_URL}/all`;
    if (id) {
      if (action === "members") {
        url = `${BACKEND_URL}/${id}/members`;
      } else {
        url = `${BACKEND_URL}/${id}`;
      }
    }

    const res = await fetch(url, {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch customer segments" });
  } catch (e) {
    console.error("Backend offline. Customer segments fetch failed:", e);
    return backendUnavailable("Customer segments fetch");
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to create customer segment" });
  } catch (e) {
    console.error("Backend offline. Customer segment creation failed:", e);
    return backendUnavailable("Customer segment creation");
  }
}

export async function DELETE(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Segment ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "DELETE",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to delete customer segment" });
  } catch (e) {
    console.error("Backend offline. Customer segment deletion failed:", e);
    return backendUnavailable("Customer segment deletion");
  }
}
