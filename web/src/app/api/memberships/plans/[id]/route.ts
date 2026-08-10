import { NextRequest } from "next/server";
import { resolveBackendUrl, fetchWithRefresh, proxyResponse, backendUnavailable } from "../../../helper";

// PATCH /api/memberships/plans/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const body = await request.json();
  const url = resolveBackendUrl(`/memberships/plans/${id}`);

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return await proxyResponse(res, {
      defaultErrorMessage: "Failed to update membership plan",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. Membership plan update failed:", e);
    return backendUnavailable("Membership plan update");
  }
}

// DELETE /api/memberships/plans/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const url = resolveBackendUrl(`/memberships/plans/${id}`);

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, url, {
      method: "DELETE",
    });
    return await proxyResponse(res, {
      defaultErrorMessage: "Failed to delete membership plan",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. Membership plan deletion failed:", e);
    return backendUnavailable("Membership plan deletion");
  }
}
