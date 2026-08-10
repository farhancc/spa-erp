import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl } from "../../../../helper";

/**
 * GET /api/cms/public/[tenantSlug]/config
 * Returns useCustomCode flag + customHtml/CSS/JS for the storefront.
 * No auth required — only returns config fields, never admin tokens.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const url = resolveBackendUrl(`/cms/public/${encodeURIComponent(tenantSlug)}/config`);

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Config not found" }, { status: res.status });
    }

    const json = await res.json();
    const data = json?.data ?? json;

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch website config" }, { status: 500 });
  }
}
