import { NextRequest, NextResponse } from "next/server";
import { handleBackendResponse, resolveBackendUrl } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/bookings/slots");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  try {
    const res = await fetch(`${BACKEND_URL}?${searchParams}`, {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
      },
    });
    if (res.ok) {
      return handleBackendResponse(res);
    }
  } catch (e) {
    console.warn("Backend database offline or returned error.");
  }

  return NextResponse.json([]);
}
