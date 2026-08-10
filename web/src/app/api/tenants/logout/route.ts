import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true, message: "Logged out successfully" });
    
    const host = request.headers.get("host") || "";
    const hostWithoutPort = host.split(":")[0];
    const parts = hostWithoutPort.split(".");
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : "";

    const domainsToClear: (string | undefined)[] = [undefined];
    if (baseDomain) {
      domainsToClear.push(`.${baseDomain}`);
      domainsToClear.push(baseDomain);
    }

    // Thoroughly clear session cookies across all potential domains
    for (const domain of domainsToClear) {
      response.cookies.set({
        name: `admin_session_${slug}`,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
        ...(domain ? { domain } : {}),
      });

      response.cookies.set({
        name: `customer_session_${slug}`,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
        ...(domain ? { domain } : {}),
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

