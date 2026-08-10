import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../helper";

const BACKEND_BASE = resolveBackendUrl("/media");
const BACKEND_UPLOAD_URL = resolveBackendUrl("/media/upload");

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  const folder = request.nextUrl.searchParams.get("folder") || "";

  try {
    const url = folder ? `${BACKEND_BASE}?folder=${encodeURIComponent(folder)}` : BACKEND_BASE;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`,
      },
      cache: "no-store",
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to fetch media library" });
  } catch (e) {
    console.error("Backend offline. Media fetch failed:", e);
    return backendUnavailable("Media list");
  }
}

export async function POST(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  try {
    const body = await request.json();
    const res = await fetch(BACKEND_UPLOAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to upload image" });
  } catch (e) {
    console.error("Backend offline. Media upload failed:", e);
    return backendUnavailable("Media upload");
  }
}

export async function DELETE(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing media asset id" }, { status: 400 });
    }
    const res = await fetch(`${BACKEND_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`,
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: "Failed to delete media asset" });
  } catch (e) {
    console.error("Backend offline. Media delete failed:", e);
    return backendUnavailable("Media delete");
  }
}
