import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The app domain — driven by env var so it works for both dev and production
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'careva.in';

// Main domains that are treated as the marketing/superadmin site (not tenant subdomains)
const MAIN_DOMAINS = [
  'careva.in',
  'www.careva.in',
  'localhost:3000',
  'localhost:3001',
  'lvh.me:3000',
  'lvh.me:3001',
  'lvm.me:3000',
  'lvm.me:3001',
  '127.0.0.1:3000',
  '127.0.0.1:3001',
];

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;

  // 1. Skip system paths, static files, and API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Identify the tenant subdomain
  let isMainDomain = false;
  let tenantSlug = '';

  const isExactMainDomain = MAIN_DOMAINS.some(
    (domain) => hostname.toLowerCase() === domain.toLowerCase()
  );

  if (isExactMainDomain) {
    isMainDomain = true;
  } else {
    // Check if it's a subdomain (e.g., "cutsalon.careva.in" or "cutsalon.lvh.me:3000")
    const hostWithoutPort = hostname.split(':')[0];
    const parts = hostWithoutPort.split('.');

    if (parts.length >= 2) {
      const potentialSubdomain = parts[0].toLowerCase();
      if (potentialSubdomain === 'www') {
        isMainDomain = true;
      } else {
        tenantSlug = potentialSubdomain;
      }
    } else {
      isMainDomain = true;
    }
  }

  // 3. Redirect /tenant/:slug/... paths on the main domain → subdomain URL
  const disableSubdomainRedirect = process.env.NEXT_PUBLIC_DISABLE_SUBDOMAIN_REDIRECT === 'true';
  if (!disableSubdomainRedirect && isMainDomain && pathname.startsWith('/tenant/')) {
    const segments = pathname.split('/');
    if (segments.length >= 3) {
      const slug = segments[2];
      const rest = '/' + segments.slice(3).join('/');
      const port = hostname.includes(':') ? ':' + hostname.split(':')[1] : '';
      const targetUrl = new URL(request.url);
      targetUrl.host = `${slug}.${APP_DOMAIN}${port}`;
      targetUrl.pathname = rest === '/' ? '' : rest;
      return NextResponse.redirect(targetUrl);
    }
  }

  // 4. Routing Logic

  // A. Main Domain → Marketing Site & Super Admin
  if (isMainDomain) {
    if (pathname.startsWith('/superadmin')) {
      const cleanPath = pathname.replace(/^\/superadmin/, '') || '/';
      return NextResponse.rewrite(
        new URL(`/superadmin${cleanPath}`, request.url)
      );
    }
    return NextResponse.next();
  }

  // B. Tenant Subdomain Routing
  if (tenantSlug) {
    // Prevent infinite rewrite loops: if Next.js already rewrote the path to /tenant/[slug],
    // let it pass through to the router.
    if (pathname.startsWith('/tenant/')) {
      return NextResponse.next();
    }

    // Verify if tenant is registered in the DB
    const cacheCookieName = `tenant_verified_${tenantSlug}`;
    const isVerifiedCookie = request.cookies.get(cacheCookieName)?.value;
    let isTenantValid = isVerifiedCookie === 'true';
    let needsCookie = false;

    if (!isVerifiedCookie) {
      try {
        const origin = request.nextUrl.origin;
        const checkUrl = new URL(`/api/tenants?slug=${tenantSlug}`, origin);
        const res = await fetch(checkUrl, { cache: 'no-store' });
        if (res.ok) {
          const tenant = await res.json();
          if (tenant) {
            isTenantValid = true;
            needsCookie = false; // We can skip cache cookie creation here if desired
          }
        }
      } catch (err) {
        console.error('Proxy verification of tenant failed:', err);
      }
    }

    const returnResponse = (res: NextResponse) => {
      if (needsCookie && isTenantValid) {
        res.cookies.set(cacheCookieName, 'true', {
          maxAge: 86400, // 24 hours cache
          path: '/',
          sameSite: 'lax',
        });
      }
      return res;
    };

    if (!isTenantValid && !isVerifiedCookie) {
      // Unregistered subdomain! Redirect to main domain.
      const hostWithoutPort = hostname.split(':')[0];
      const parts = hostWithoutPort.split('.');
      const baseDomain = parts.slice(1).join('.');
      const port = hostname.includes(':') ? ':' + hostname.split(':')[1] : '';
      
      const redirectUrl = new URL(request.url);
      redirectUrl.host = `${baseDomain || APP_DOMAIN}${port}`;
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    // ERP Dashboard: tenant.careva.in/admin
    if (pathname.startsWith('/admin')) {
      const adminCookieName = `admin_session_${tenantSlug}`;
      const customerCookieName = `customer_session_${tenantSlug}`;
      const adminToken = request.cookies.get(adminCookieName)?.value;
      const customerToken = request.cookies.get(customerCookieName)?.value;

      // Guard: if a customer is logged in but not an admin, redirect to account page
      if (!adminToken && customerToken) {
        return returnResponse(NextResponse.redirect(new URL('/account', request.url)));
      }

      if (adminToken) {
        try {
          const parts = adminToken.split('.');
          if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(payloadBase64));
            if (payload.slug === tenantSlug) {
              const cleanPath = pathname.replace(/^\/admin/, '') || '/';
              return returnResponse(NextResponse.rewrite(
                new URL(`/tenant/${tenantSlug}/admin${cleanPath}`, request.url)
              ));
            }
          }
        } catch {
          // Clear cookie if invalid and let rewrite render the login gate
          const cleanPath = pathname.replace(/^\/admin/, '') || '/';
          const res = NextResponse.rewrite(
            new URL(`/tenant/${tenantSlug}/admin${cleanPath}`, request.url)
          );
          res.cookies.delete(adminCookieName);
          return returnResponse(res);
        }
      }

      // If no token or invalid token, rewrite to the admin layout (which will display the login gate)
      const cleanPath = pathname.replace(/^\/admin/, '') || '/';
      return returnResponse(NextResponse.rewrite(
        new URL(`/tenant/${tenantSlug}/admin${cleanPath}`, request.url)
      ));
    }

    // Customer Account Portal: tenant.careva.in/account
    if (pathname.startsWith('/account')) {
      const cleanPath = pathname.replace(/^\/account/, '') || '/';
      return returnResponse(NextResponse.rewrite(
        new URL(`/tenant/${tenantSlug}/account${cleanPath}`, request.url)
      ));
    }

    // Signup/Login on subdomain
    if (pathname.startsWith('/signup')) {
      return returnResponse(NextResponse.rewrite(
        new URL(`/tenant/${tenantSlug}/signup`, request.url)
      ));
    }

    if (pathname.startsWith('/login')) {
      const cookieName = `admin_session_${tenantSlug}`;
      const token = request.cookies.get(cookieName)?.value;
      const hasRedirect = request.nextUrl.searchParams.get('redirect');

      if (token && !hasRedirect) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(payloadBase64));
            if (payload.slug === tenantSlug) {
              const adminUrl = new URL('/admin', request.url);
              return returnResponse(NextResponse.redirect(adminUrl));
            }
          }
        } catch {
          // Ignore invalid token on login page, let it overwrite
        }
      }

      return returnResponse(NextResponse.rewrite(
        new URL(`/tenant/${tenantSlug}/login`, request.url)
      ));
    }

    // Public booking website: tenant.careva.in/
    return returnResponse(NextResponse.rewrite(
      new URL(`/tenant/${tenantSlug}${pathname}`, request.url)
    ));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
