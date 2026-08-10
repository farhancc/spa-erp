import { NextRequest } from "next/server";
import { resolveBackendUrl, fetchWithRefresh, proxyResponse, backendUnavailable } from "../../helper";

const BACKEND_URL = resolveBackendUrl("/memberships/enrollments");

// GET /api/memberships/enrollments?planId=...&customerId=...
export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const planId = request.nextUrl.searchParams.get("planId");
  const customerId = request.nextUrl.searchParams.get("customerId");

  let url = BACKEND_URL;
  const params = new URLSearchParams();
  if (planId) params.set("planId", planId);
  if (customerId) params.set("customerId", customerId);
  if (params.toString()) url += `?${params.toString()}`;

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, url, {
      cache: "no-store",
    });
    return await proxyResponse(res, {
      defaultErrorMessage: "Failed to fetch enrollments",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. Enrollment fetch failed:", e);
    return backendUnavailable("Enrollment list");
  }
}

// POST /api/memberships/enrollments
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
      defaultErrorMessage: "Failed to enroll customer",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. Customer enrollment failed:", e);
    return backendUnavailable("Customer enrollment");
  }
}
