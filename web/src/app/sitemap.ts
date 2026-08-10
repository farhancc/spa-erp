import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL
  ? `${process.env.BACKEND_API_URL}/superadmin/tenants`
  : "http://localhost:3001/api/v1/superadmin/tenants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // 1. Detect if we are on a tenant subdomain or the main domain
  const hostWithoutPort = host.split(':')[0];
  const parts = hostWithoutPort.split('.');
  
  let tenantSlug = '';
  // Check if we have a subdomain on lvh.me or the production domain
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'lvh') {
    // If local dev like cutsalon.lvh.me, parts will be ['cutsalon', 'lvh', 'me'] -> parts[0] is cutsalon
    tenantSlug = parts[0];
  }

  const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${scheme}://${host}`;

  // 2. Main Domain Sitemap
  if (!tenantSlug) {
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];
  }

  // 3. Tenant Subdomain Sitemap
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/booking`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
