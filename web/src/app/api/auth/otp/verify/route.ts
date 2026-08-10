import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "careva-fallback-secret";

export async function POST(request: NextRequest) {
  try {
    const { slug, phone, enteredOtp } = await request.json();

    if (!slug || !phone || !enteredOtp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cookieName = `otp_token_${slug}`;
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "Verification code expired or not found. Please request a new one." }, { status: 400 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (decoded.phone !== phone) {
        return NextResponse.json({ error: "Phone number mismatch. Please request a new OTP." }, { status: 400 });
      }

      if (decoded.otpCode !== enteredOtp.trim()) {
        return NextResponse.json({ error: "Incorrect verification code. Please check your WhatsApp and try again." }, { status: 400 });
      }

      // Verification successful! Clear cookie
      const response = NextResponse.json({ ok: true, message: "OTP verified successfully!" });
      response.cookies.set({
        name: cookieName,
        value: "",
        httpOnly: true,
        maxAge: 0,
        path: "/",
      });

      return response;
    } catch (err: any) {
      return NextResponse.json({ error: "Verification code expired or invalid." }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Secure OTP verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
