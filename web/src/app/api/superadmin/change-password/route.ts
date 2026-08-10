import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Superadmin change-password — verifies current password against the stored bcrypt hash,
 * then outputs the new hash so the operator can update SUPERADMIN_PASSWORD_HASH in their
 * env file. We do NOT write anything to disk.
 *
 * The response includes `newHash` which the operator must set as the new
 * SUPERADMIN_PASSWORD_HASH environment variable and restart the server.
 */

const SUPERADMIN_SESSION_SECRET =
  process.env.SUPERADMIN_SESSION_SECRET ||
  process.env.JWT_SECRET ||
  "superadmin-secret-fallback";
const COOKIE_NAME = "superadmin_session";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify superadmin session
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, SUPERADMIN_SESSION_SECRET) as any;
    if (decoded.role !== "SUPERADMIN") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 12) {
      return NextResponse.json(
        { ok: false, error: "New password must be at least 12 characters" },
        { status: 400 }
      );
    }

    // 3. Verify current password against env hash
    const storedHash = process.env.SUPERADMIN_PASSWORD_HASH || "";
    if (!storedHash) {
      return NextResponse.json(
        { ok: false, error: "Superadmin authentication is not configured" },
        { status: 503 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { ok: false, error: "Incorrect current password" },
        { status: 400 }
      );
    }

    // 4. Generate new bcrypt hash and return it for the operator to set in the env
    const newHash = await bcrypt.hash(newPassword, 12);

    return NextResponse.json({
      ok: true,
      message:
        "Password hash generated. Set SUPERADMIN_PASSWORD_HASH in your environment and restart the server.",
      newHash,
    });
  } catch (err) {
    console.error("Superadmin change password error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
