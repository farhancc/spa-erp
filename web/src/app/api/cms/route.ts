import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, handleBackendResponse } from "../helper";

const BACKEND_CMS = resolveBackendUrl("/cms/config");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const res = await fetch(BACKEND_CMS, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-slug": tenantSlug,
      "Content-Type": "application/json",
    },
  });
  return handleBackendResponse(res);
}

export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const body = await request.json();
  const res = await fetch(BACKEND_CMS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-tenant-slug": tenantSlug,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleBackendResponse(res);
}
