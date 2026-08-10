import { NextRequest, NextResponse } from "next/server";
import { handleBackendResponse } from "../../../helper";

const BACKEND_URL = `${process.env.BACKEND_API_URL || "http://localhost:3001/api/v1"}/pos/invoices`;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || "";
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return handleBackendResponse(res);
    }
    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errData.message || "Failed to update invoice on backend" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend database connection failed:", e.message);
    return NextResponse.json(
      { error: "Backend database connection failed" },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = request.cookies.get("access_token")?.value 
    || (tenantSlug ? request.cookies.get(`admin_session_${tenantSlug}`)?.value : "")
    || "";

  try {
    const res = await fetch(`${BACKEND_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    if (res.ok) {
      return new NextResponse(null, { status: 204 });
    }
    const errText = await res.text();
    return NextResponse.json(
      { error: errText || "Failed to delete invoice from backend" },
      { status: res.status }
    );
  } catch (e: any) {
    console.error("Backend database connection failed:", e.message);
    return NextResponse.json(
      { error: "Backend database connection failed" },
      { status: 502 }
    );
  }
}
