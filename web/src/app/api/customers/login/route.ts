import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { slug, email: inputEmail, phone: inputPhone, username, password } = await request.json();
    const loginVal = (inputEmail || inputPhone || username || "").trim();

    if (!slug || !loginVal || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isEmail = loginVal.includes("@");
    const email = isEmail ? loginVal : undefined;
    const phone = !isEmail ? loginVal : undefined;

    const backendUrl = `${process.env.BACKEND_API_URL || "http://localhost:3001/api/v1"}/auth/customer/login`;
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": slug,
      },
      body: JSON.stringify({ email, phone, password, slug }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: errData.message || "Invalid credentials" }, { status: res.status });
    }

    let data = await res.json();
    if (data && typeof data === "object" && "success" in data && "data" in data) {
      data = data.data;
    }

    if (!data.ok || !data.token) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    let backendRefreshToken = "";
    const setCookies = res.headers.getSetCookie();
    for (const cookie of setCookies) {
      const parts = cookie.split(";")[0].split("=");
      if (parts[0].trim() === "refresh_token") {
        backendRefreshToken = parts[1].trim();
      }
    }

    // Set cookie and return success
    const response = NextResponse.json({
      ok: true,
      message: "Customer authentication successful",
      customer: data.customer,
    });

    response.cookies.set({
      name: `customer_session_${slug}`,
      value: data.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    if (backendRefreshToken) {
      response.cookies.set({
        name: `customer_refresh_token_${slug}`,
        value: backendRefreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Customer login endpoint error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
