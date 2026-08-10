import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_BASE = resolveBackendUrl("/whatsapp/rules");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  try {
    const res = await fetch(BACKEND_BASE, {
      cache: "no-store",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`,
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch auto-reply rules" });
  } catch (e) {
    return backendUnavailable("Auto-reply rules");
  }
}

export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const body = await request.json();

  try {
    const res = await fetch(BACKEND_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to save auto-reply rule" });
  } catch (e) {
    return backendUnavailable("Auto-reply rule save");
  }
}
