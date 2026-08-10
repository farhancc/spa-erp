import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "careva-fallback-secret";

async function tryRefreshToken(request: NextRequest, slug: string) {
  const refreshCookieName = `refresh_token_${slug}`;
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
      // Extract new refresh token if any
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
    console.error("Failed to refresh token:", err);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ ok: false, error: "slug is required" }, { status: 400 });
    }

    const cookieName = `admin_session_${slug}`;
    const token = request.cookies.get(cookieName)?.value;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.slug === slug) {
          return NextResponse.json({
            ok: true,
            user: {
              name: decoded.name,
              email: decoded.email,
              slug: decoded.slug,
              role: decoded.role,
              outletId: decoded.outletId,
            }
          });
        }
      } catch (e) {
        // Token expired or invalid, fall through to refresh logic
      }
    }

    // Try refreshing using the refresh token
    const refreshResult = await tryRefreshToken(request, slug);
    if (refreshResult) {
      try {
        const decoded = jwt.verify(refreshResult.accessToken, JWT_SECRET) as any;
        if (decoded.slug === slug) {
          const response = NextResponse.json({
            ok: true,
            user: {
              name: decoded.name,
              email: decoded.email,
              slug: decoded.slug,
              role: decoded.role,
              outletId: decoded.outletId,
            }
          });

          // Set the new access token cookie
          response.cookies.set({
            name: `admin_session_${slug}`,
            value: refreshResult.accessToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
            domain: process.env.COOKIE_DOMAIN || undefined,
          });

          // Set the new refresh token cookie
          response.cookies.set({
            name: `refresh_token_${slug}`,
            value: refreshResult.refreshToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            domain: process.env.COOKIE_DOMAIN || undefined,
          });

          return response;
        }
      } catch (e) {
        console.error("Failed to verify newly refreshed token:", e);
      }
    }

    return NextResponse.json({ ok: false, error: "No session token or refresh token found" });
  } catch (err) {
    console.error("Session verification error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
