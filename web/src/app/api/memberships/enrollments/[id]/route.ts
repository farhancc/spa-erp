import { NextRequest } from "next/server";
import { resolveBackendUrl, fetchWithRefresh, proxyResponse, backendUnavailable } from "../../../helper";

// DELETE /api/memberships/enrollments/[id]  (revoke)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const url = resolveBackendUrl(`/memberships/enrollments/${id}`);

  try {
    const { res, newAccessToken, newRefreshToken } = await fetchWithRefresh(request, url, {
      method: "DELETE",
    });
    return await proxyResponse(res, {
      defaultErrorMessage: "Failed to revoke enrollment",
      newAccessToken,
      newRefreshToken,
      tenantSlug,
    });
  } catch (e) {
    console.error("Backend offline. Enrollment revocation failed:", e);
    return backendUnavailable("Enrollment revocation");
  }
}
