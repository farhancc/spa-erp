import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, fetchWithRefresh, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/whatsapp/session");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, BACKEND_URL, {
      cache: "no-store",
    });
    return await proxyResponse(res, { 
      defaultErrorMessage: "Failed to fetch WhatsApp session status",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. WhatsApp session status fetch failed:", e);
    return backendUnavailable("WhatsApp session status");
  }
}

export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const { action, phoneNumber } = await request.json();

  let targetUrl = BACKEND_URL;
  let method = "POST";
  let body: any = undefined;

  if (action === "qr") {
    targetUrl = `${BACKEND_URL}/qr`;
  } else if (action === "connect") {
    targetUrl = `${BACKEND_URL}/connect`;
    body = JSON.stringify({ phoneNumber });
  } else if (action === "disconnect") {
    method = "DELETE";
  }

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, targetUrl, {
      method,
      headers: { 
        "Content-Type": "application/json",
      },
      body,
    });
    return await proxyResponse(res, { 
      defaultErrorMessage: "Failed to perform WhatsApp session action",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. WhatsApp session action failed:", e);
    return backendUnavailable("WhatsApp session action");
  }
}
