import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Superadmin credentials are sourced ONLY from environment variables.
 * The flat-file superadmin-credentials.json is no longer used.
 *
 * Required env vars:
 *   SUPERADMIN_EMAIL            — the admin email
 *   SUPERADMIN_PASSWORD_HASH    — bcrypt hash of the password (run `scripts/hash-superadmin-pw.ts` to generate)
 *
 * Fallback (dev only, never production):
 *   SUPERADMIN_PASSWORD         — plaintext, will be compared with bcrypt.compare against the hash
 */
function getSuperadminCredentials(): { email: string; passwordHash: string } {
  const email = process.env.SUPERADMIN_EMAIL || "admin@careva.in";
  const passwordHash = process.env.SUPERADMIN_PASSWORD_HASH || "";
  return { email, passwordHash };
}

const SUPERADMIN_SESSION_SECRET =
  process.env.SUPERADMIN_SESSION_SECRET ||
  process.env.JWT_SECRET ||
  "superadmin-secret-fallback";

const COOKIE_NAME = "superadmin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

/** POST /api/superadmin/login — validates credentials server-side, sets HTTP-only cookie */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    const credentials = getSuperadminCredentials();

    // Email check (case-insensitive)
    if (email.trim().toLowerCase() !== credentials.email.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Invalid superadmin credentials" },
        { status: 401 }
      );
    }

    // Password check — always bcrypt
    if (!credentials.passwordHash) {
      console.error(
        "SUPERADMIN_PASSWORD_HASH env var is not set. " +
        "Run `npx ts-node scripts/hash-superadmin-pw.ts <password>` to generate one."
      );
      return NextResponse.json(
        { ok: false, error: "Superadmin authentication is not configured" },
        { status: 503 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, credentials.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid superadmin credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { role: "SUPERADMIN", email: credentials.email },
      SUPERADMIN_SESSION_SECRET,
      { expiresIn: "8h" }
    );

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Superadmin login error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** GET /api/superadmin/login — verifies the HTTP-only session cookie */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ ok: false });
    }

    const decoded = jwt.verify(token, SUPERADMIN_SESSION_SECRET) as any;
    if (decoded.role !== "SUPERADMIN") {
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true, email: decoded.email });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

/** DELETE /api/superadmin/login — clears the session cookie */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
