import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { slug, email: inputEmail, username, password } = await request.json();
    const loginVal = (inputEmail || username || "").trim();

    if (!slug || !loginVal || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isEmail = loginVal.includes("@");
    const email = isEmail ? loginVal : undefined;
    const phone = !isEmail ? loginVal : undefined;

    let token: string | null = null;
    let user: any = null;
    let backendRefreshToken = "";

    // Try authenticating with the NestJS backend
    try {
      const loginUrl = `${process.env.BACKEND_API_URL || "http://localhost:3001/api/v1"}/auth/login`;
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": slug,
        },
        body: JSON.stringify({ email, phone, password, slug }),
        cache: "no-store",
      });

      if (res.ok) {
        let data = await res.json();
        if (data && typeof data === "object" && "success" in data && "data" in data) {
          data = data.data;
        }
        if (data.ok && data.token) {
          token = data.token;
          user = data.user;

          // Extract refresh token from backend response cookies
          const setCookies = res.headers.getSetCookie();
          for (const cookie of setCookies) {
            const parts = cookie.split(";")[0].split("=");
            if (parts[0].trim() === "refresh_token") {
              backendRefreshToken = parts[1].trim();
            }
          }
        }
      } else if (res.status === 401 || res.status === 400) {
        let errData = await res.json().catch(() => ({}));
        if (errData && typeof errData === "object" && "success" in errData && "data" in errData) {
          errData = errData.data;
        }
        return NextResponse.json({ error: errData.message || "Invalid email or password" }, { status: 401 });
      }
    } catch (e) {
      console.warn("Backend auth offline during login. Using local file DB fallback:", e);
    }

    // If the backend is offline and we have no token, we cannot verify credentials.
    // Returning 503 is correct — we must not attempt password verification without
    // the authoritative bcrypt hash from PostgreSQL.
    if (!token || !user) {
      return NextResponse.json(
        { error: "Authentication service is temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    // Create the response
    const response = NextResponse.json({
      ok: true,
      message: "Authentication successful",
      user: {
        name: user.name || "Owner",
        email: user.email,
        slug: slug,
        role: user.role || "OWNER",
        outletId: user.outletId || null,
      }
    });

    // Set HTTP-only session cookie
    response.cookies.set({
      name: `admin_session_${slug}`,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });

    if (backendRefreshToken) {
      response.cookies.set({
        name: `refresh_token_${slug}`,
        value: backendRefreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        domain: process.env.COOKIE_DOMAIN || undefined,
      });
    }

    return response;
  } catch (err: any) {
    console.error("Login endpoint error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
