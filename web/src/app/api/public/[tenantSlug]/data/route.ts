import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl } from "../../../helper";

/**
 * GET /api/public/[tenantSlug]/data
 * Public, no-auth proxy for custom HTML storefront data (services, stylists, outlets).
 * Rate-limited server-side. No sensitive data exposed.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const url = resolveBackendUrl(`/cms/public/${encodeURIComponent(tenantSlug)}/data`);

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      // Cache for 30s at CDN level to reduce DB hits
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Tenant not found" }, { status: res.status });
    }

    const json = await res.json();
    const data = json?.data ?? json;

    return NextResponse.json(data, {
      headers: {
        // Allow CDN caching, public data only
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch public data" }, { status: 500 });
  }
}
