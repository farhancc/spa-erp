import { NextRequest } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../../helper";

const BACKEND_URL = resolveBackendUrl("/whatsapp/session/config");

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
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to configure WhatsApp session" });
  } catch (e) {
    return backendUnavailable("WhatsApp session config");
  }
}
