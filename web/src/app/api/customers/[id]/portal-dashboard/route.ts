import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../../helper";

const BACKEND_URL = resolveBackendUrl("/customers");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  if (!id) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/${id}/portal-dashboard`, {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch customer dashboard data" });
  } catch (e) {
    console.error("Backend offline. Customer portal dashboard fetch failed:", e);
    return backendUnavailable("Customer portal dashboard fetch");
  }
}
