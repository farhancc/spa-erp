import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../../helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path ? `/${resolvedParams.path.join("/")}` : "";
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  
  const backendPath = `/consent${subPath}`;
  const BACKEND_URL = resolveBackendUrl(backendPath);

  try {
    const res = await fetch(`${BACKEND_URL}?${searchParams}`, {
      cache: "no-store",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: `Failed to fetch consent ${subPath}` });
  } catch (e) {
    console.error(`Backend offline. Consent fetch ${subPath} failed:`, e);
    return backendUnavailable(`Consent fetch ${subPath}`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path ? `/${resolvedParams.path.join("/")}` : "";
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  
  let body: any = null;
  try {
    body = await request.json();
  } catch (err) {
    // No body
  }

  const backendPath = `/consent${subPath}`;
  const BACKEND_URL = resolveBackendUrl(backendPath);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await proxyResponse(res, { defaultErrorMessage: `Failed to create consent ${subPath}` });
  } catch (e) {
    console.error(`Backend offline. Consent create ${subPath} failed:`, e);
    return backendUnavailable(`Consent create ${subPath}`);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path ? `/${resolvedParams.path.join("/")}` : "";
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  
  let body: any = null;
  try {
    body = await request.json();
  } catch (err) {
    // No body
  }

  const backendPath = `/consent${subPath}`;
  const BACKEND_URL = resolveBackendUrl(backendPath);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await proxyResponse(res, { defaultErrorMessage: `Failed to update consent ${subPath}` });
  } catch (e) {
    console.error(`Backend offline. Consent update ${subPath} failed:`, e);
    return backendUnavailable(`Consent update ${subPath}`);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path ? `/${resolvedParams.path.join("/")}` : "";
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  const backendPath = `/consent${subPath}`;
  const BACKEND_URL = resolveBackendUrl(backendPath);

  try {
    const res = await fetch(BACKEND_URL, {
      method: "DELETE",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: `Failed to delete consent ${subPath}` });
  } catch (e) {
    console.error(`Backend offline. Consent delete ${subPath} failed:`, e);
    return backendUnavailable(`Consent delete ${subPath}`);
  }
}
