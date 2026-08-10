import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/bookings");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  // Check for admin or customer session tokens
  const token = extractToken(request.cookies, tenantSlug)
    || request.cookies.get(`customer_session_${tenantSlug}`)?.value
    || "";
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, reason, ...dto } = body;

    let targetUrl = `${BACKEND_URL}/${id}`;
    let requestBody = JSON.stringify(dto);

    if (action === "cancel") {
      targetUrl = `${BACKEND_URL}/${id}/cancel`;
      requestBody = JSON.stringify({ reason });
    } else if (action === "complete") {
      targetUrl = `${BACKEND_URL}/${id}/complete`;
      requestBody = JSON.stringify({});
    }

    const res = await fetch(targetUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: requestBody,
    });

    return await proxyResponse(res, { defaultErrorMessage: "Failed to update booking" });
  } catch (e) {
    console.error("Backend offline. Booking update failed:", e);
    return backendUnavailable("Booking update");
  }
}
