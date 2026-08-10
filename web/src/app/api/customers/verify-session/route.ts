import { NextRequest, NextResponse } from "next/server";

async function tryCustomerRefreshToken(request: NextRequest, tenantSlug: string) {
  const refreshCookieName = `customer_refresh_token_${tenantSlug}`;
  const refreshToken = request.cookies.get(refreshCookieName)?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const refreshUrl = `${process.env.BACKEND_API_URL || "http://localhost:3001/api/v1"}/auth/refresh`;
    const res = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `refresh_token=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data && data.ok && data.token) {
      let newBackendRefreshToken = "";
      const setCookies = res.headers.getSetCookie();
      for (const cookie of setCookies) {
        const parts = cookie.split(";")[0].split("=");
        if (parts[0].trim() === "refresh_token") {
          newBackendRefreshToken = parts[1].trim();
        }
      }

      return {
        accessToken: data.token,
        refreshToken: newBackendRefreshToken || refreshToken,
      };
    }
  } catch (err) {
    console.error("Failed to refresh customer token:", err);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  if (!tenantSlug) {
    return NextResponse.json({ ok: false, error: "x-tenant-slug header is required" }, { status: 400 });
  }

  const token = request.cookies.get(`customer_session_${tenantSlug}`)?.value;
  const backendUrl = `${process.env.BACKEND_API_URL || "http://localhost:3001/api/v1"}/auth/me`;

  if (token) {
    try {
      const res = await fetch(backendUrl, {
        cache: "no-store",
        headers: {
          "x-tenant-slug": tenantSlug,
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ ok: true, customer: data?.data || data });
      }
    } catch (err) {
      console.warn("Auth check failed, attempting refresh:", err);
    }
  }

  // Session missing or expired, attempt refresh
  const refreshResult = await tryCustomerRefreshToken(request, tenantSlug);
  if (refreshResult) {
    try {
      const res = await fetch(backendUrl, {
        cache: "no-store",
        headers: {
          "x-tenant-slug": tenantSlug,
          "Authorization": `Bearer ${refreshResult.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const response = NextResponse.json({ ok: true, customer: data?.data || data });

        response.cookies.set({
          name: `customer_session_${tenantSlug}`,
          value: refreshResult.accessToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24, // 1 day
          path: "/",
        });

        response.cookies.set({
          name: `customer_refresh_token_${tenantSlug}`,
          value: refreshResult.refreshToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });

        return response;
      }
    } catch (err) {
      console.error("Profile fetch after refresh failed:", err);
    }
  }

  return NextResponse.json({ ok: false, error: "Session expired or invalid" }, { status: 401 });
}
