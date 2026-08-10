import { NextRequest, NextResponse } from "next/server";

/**
 * Unwraps the NestJS backend TransformResponseInterceptor envelope ({ success, data })
 * if present, and returns a Next.js NextResponse.
 */
export async function handleBackendResponse(res: Response) {
  if (res.status === 204 || res.status === 205) {
    return new NextResponse(null, { status: res.status });
  }

  let text = "";
  try {
    text = await res.text();
  } catch {
    return new NextResponse(null, { status: res.status });
  }

  if (!text) {
    return new NextResponse(null, { status: res.status });
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "text/plain" } });
  }

  if (data && typeof data === "object" && "success" in data && "data" in data) {
    if (data.meta !== undefined) {
      return NextResponse.json({
        data: data.data,
        meta: data.meta,
      });
    }
    data = data.data;
  }
  return NextResponse.json(data);
}

/**
 * Resolves full backend API URL for the given path suffix.
 */
export function resolveBackendUrl(path: string): string {
  const baseUrl = process.env.BACKEND_API_URL || "http://localhost:3001/api/v1";
  if (baseUrl.includes("/superadmin/tenants")) {
    return baseUrl.replace("/superadmin/tenants", path);
  }
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Extracts the auth token from the request cookies.
 * Tries generic access_token first, then the tenant-scoped admin session cookie.
 */
export function extractToken(
  cookies: { get: (name: string) => { value: string } | undefined },
  tenantSlug: string
): string {
  return (
    cookies.get("access_token")?.value ||
    (tenantSlug ? cookies.get(`admin_session_${tenantSlug}`)?.value : "") ||
    ""
  );
}

/**
 * Performs a fetch to the backend. If it receives a 401 Unauthorized, it attempts to
 * transparently refresh the access token using the client's refresh token, then retries
 * the original request.
 */
export async function fetchWithRefresh(
  request: NextRequest,
  url: string,
  init: RequestInit = {}
): Promise<{ res: Response; newAccessToken?: string; newRefreshToken?: string }> {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);

  const headers = {
    "x-tenant-slug": tenantSlug,
    "Authorization": `Bearer ${token}`,
    ...(init.headers || {}),
  } as any;

  let res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    const refreshToken = request.cookies.get(`refresh_token_${tenantSlug}`)?.value;
    if (refreshToken) {
      try {
        const refreshUrl = resolveBackendUrl("/auth/refresh");
        const refreshRes = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            "x-tenant-slug": tenantSlug,
            "Cookie": `refresh_token=${refreshToken}`,
          },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData?.token || refreshData?.data?.token;

          // Extract new refresh token from set-cookie header if any
          const setCookies = refreshRes.headers.getSetCookie();
          let newRefreshToken = "";
          for (const cookie of setCookies) {
            const parts = cookie.split(';')[0].split('=');
            if (parts[0].trim() === 'refresh_token') {
              newRefreshToken = parts[1].trim();
            }
          }

          if (newAccessToken) {
            // Retry the original request with the new access token
            headers["Authorization"] = `Bearer ${newAccessToken}`;
            res = await fetch(url, {
              ...init,
              headers,
            });

            return {
              res,
              newAccessToken,
              newRefreshToken,
            };
          }
        }
      } catch (e) {
        console.error("Token auto-refresh failed:", e);
      }
    }
  }

  return { res };
}

/**
 * Proxies a fetch response from the NestJS backend to the Next.js client.
 *
 * - If the backend returns a successful response, unwrap and forward it.
 * - If the backend returns an error response (4xx/5xx), forward the error body
 *   with the same status code.
 * - If the backend is unreachable (network error), return 503.
 *
 * NO silent fallbacks. The client always receives an accurate HTTP status.
 */
export async function proxyResponse(
  res: Response,
  {
    defaultErrorMessage = "Backend request failed",
    newAccessToken,
    newRefreshToken,
    tenantSlug,
  }: {
    defaultErrorMessage?: string;
    newAccessToken?: string;
    newRefreshToken?: string;
    tenantSlug?: string;
  } = {}
): Promise<NextResponse> {
  let response: NextResponse;
  if (res.ok) {
    response = await handleBackendResponse(res);
  } else {
    // Forward the backend error body and status to the client
    let errorBody: any;
    try {
      errorBody = await res.json();
      // Unwrap NestJS envelope if present
      if (errorBody && typeof errorBody === "object" && "success" in errorBody && "data" in errorBody) {
        errorBody = errorBody.data;
      }
    } catch {
      errorBody = { error: defaultErrorMessage };
    }

    response = NextResponse.json(
      { error: errorBody?.message || errorBody?.error || defaultErrorMessage },
      { status: res.status }
    );
  }

  // Set updated cookies if refreshed
  if (newAccessToken && tenantSlug) {
    response.cookies.set({
      name: `admin_session_${tenantSlug}`,
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }
  if (newRefreshToken && tenantSlug) {
    response.cookies.set({
      name: `refresh_token_${tenantSlug}`,
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }

  return response;
}

/**
 * Returns a standardised 503 Service Unavailable response.
 * Use in catch blocks when fetch itself throws (backend unreachable).
 */
export function backendUnavailable(context?: string): NextResponse {
  const message = context
    ? `Backend unavailable: ${context}`
    : "Backend service is currently unavailable. Please try again later.";
  return NextResponse.json({ error: message }, { status: 503 });
}
