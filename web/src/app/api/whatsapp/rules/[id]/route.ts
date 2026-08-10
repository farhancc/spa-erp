import { NextRequest } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../../helper";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  try {
    const res = await fetch(resolveBackendUrl(`/whatsapp/rules/${id}`), {
      method: "DELETE",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`,
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to delete auto-reply rule" });
  } catch (e) {
    return backendUnavailable("Auto-reply rule delete");
  }
}
