import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || 'careva.in';
  
  const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',       // Block CRM/POS dashboards
        '/superadmin/',  // Block superadmin dashboard
        '/api/',         // Block API endpoints
      ],
    },
    sitemap: `${scheme}://${host}/sitemap.xml`,
  };
}
