import React from "react";
import { redirect } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

// ─── 1. HELPER FOR FETCHING TENANT DATA FROM BACKEND ───────────────────
async function getTenantData(slug: string) {
  const BACKEND_URL = process.env.BACKEND_API_URL
    ? `${process.env.BACKEND_API_URL}/superadmin/tenants`
    : "http://localhost:3001/api/v1/superadmin/tenants";

  try {
    const res = await fetch(`${BACKEND_URL}?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 }, // Cache response for 60 seconds (ISR style)
    });
    if (res.ok) {
      const envelope = await res.json();
      const dbData = envelope.success === false ? null : (envelope.data || envelope);
      if (dbData) {
        // Strip sensitive fields defensively
        const { ownerPassword: _pw, ...sanitized } = dbData;
        return sanitized;
      }
    }
  } catch (error) {
    console.error("Failed to fetch tenant metadata from backend on server:", error);
  }

  return null;
}

// ─── 2. DYNAMIC SEO METADATA GENERATION ─────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ tenantSlug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getTenantData(tenantSlug);

  if (!tenant) {
    return {
      title: "Careva Storefront",
      description: "Book premium salon & spa services online",
    };
  }

  const title = `${tenant.name} | Book Premium Salon & Spa Services`;
  const description = tenant.tagline || tenant.subtitle || `Book appointments online at ${tenant.name}`;
  const logoUrl = tenant.logoUrl || `https://${tenantSlug}.careva.in/favicon.ico`;

  return {
    title,
    description,
    metadataBase: new URL(`https://${tenantSlug}.careva.in`),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: `https://${tenantSlug}.careva.in`,
      siteName: tenant.name,
      images: [
        {
          url: logoUrl,
          width: 800,
          height: 600,
          alt: `${tenant.name} logo`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [logoUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ─── 3. LAYOUT COMPONENT ────────────────────────────────────────────────
export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { tenantSlug } = await params;
  const tenant = await getTenantData(tenantSlug);

  // Guard: If tenant does not exist or is inactive, redirect to main landing page
  if (!tenant || tenant.isActive === false) {
    redirect("/");
  }

  // Generate JSON-LD Local Business Schema dynamically
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": tenant.name,
    "image": tenant.logoUrl || "",
    "url": `https://${tenantSlug}.careva.in`,
    "telephone": tenant.phone || "",
    "address": tenant.outlets?.[0] ? {
      "@type": "PostalAddress",
      "streetAddress": tenant.outlets[0].address,
      "addressLocality": tenant.city || "",
      "addressCountry": "IN"
    } : undefined,
    "priceRange": "$$",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Inject Structured Data for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
