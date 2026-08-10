import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/whatsapp/birthday-settings");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "GET",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      }
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to retrieve WhatsApp birthday settings" });
  } catch (e) {
    console.error("Backend offline. Fetch birthday settings failed:", e);
    return backendUnavailable("WhatsApp Birthday Settings");
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
    return await proxyResponse(res, { defaultErrorMessage: "Failed to save WhatsApp birthday settings" });
  } catch (e) {
    console.error("Backend offline. Save birthday settings failed:", e);
    return backendUnavailable("WhatsApp Birthday Settings");
  }
}
