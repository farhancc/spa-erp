import { NextRequest } from "next/server";
import { resolveBackendUrl, fetchWithRefresh, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/memberships/plans");

// GET /api/memberships/plans
export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, BACKEND_URL, {
      cache: "no-store",
    });
    return await proxyResponse(res, {
      defaultErrorMessage: "Failed to fetch membership plans",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. Membership plans fetch failed:", e);
    return backendUnavailable("Membership plans");
  }
}

// POST /api/memberships/plans
export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const body = await request.json();

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return await proxyResponse(res, {
      defaultErrorMessage: "Failed to create membership plan",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. Membership plan creation failed:", e);
    return backendUnavailable("Membership plan creation");
  }
}
