import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl, extractToken, proxyResponse, backendUnavailable } from "../helper";

export async function GET(request: NextRequest) {
  const tenantSlug = request.headers.get("x-tenant-slug") || "";
  const token = extractToken(request.cookies, tenantSlug);
  
  const type = request.nextUrl.searchParams.get("type") || "summary";
  const days = request.nextUrl.searchParams.get("days") || "";
  const limit = request.nextUrl.searchParams.get("limit") || "";
  const fromDate = request.nextUrl.searchParams.get("from") || "";
  const toDate = request.nextUrl.searchParams.get("to") || "";

  let path = "/reports/summary";
  if (type === "daily-revenue") path = "/reports/daily-revenue";
  else if (type === "outlets") path = "/reports/outlets";
  else if (type === "staff") path = "/reports/staff";
  else if (type === "services") path = "/reports/services";
  else if (type === "retention") path = "/reports/retention";
  else if (type === "bookings") path = "/reports/bookings";
  else if (type === "gstr") path = "/reports/gstr";
  else if (type === "forecast") path = "/reports/forecast";

  const backendUrl = new URL(resolveBackendUrl(path));
  if (days) backendUrl.searchParams.set("days", days);
  if (limit) backendUrl.searchParams.set("limit", limit);
  if (fromDate) backendUrl.searchParams.set("from", fromDate);
  if (toDate) backendUrl.searchParams.set("to", toDate);

  try {
    const res = await fetch(backendUrl.toString(), {
      cache: "no-store",
      headers: { 
        "x-tenant-slug": tenantSlug,
        "Authorization": `Bearer ${token}`
      },
    });
    return await proxyResponse(res, { defaultErrorMessage: `Failed to fetch reports: ${type}` });
  } catch (e) {
    console.error(`Backend offline. Reports ${type} fetch failed:`, e);
    return backendUnavailable(`Reports ${type} fetch`);
  }
}
