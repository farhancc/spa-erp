import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    // Local dev with lvh.me wildcard DNS
    "localhost:3000",
    "localhost:3001",
    "lvh.me:3000",
    "lvh.me:3001",
    "*.lvh.me",
    "*.lvh.me:3000",
    "*.lvh.me:3001",
    // Production domain
    "careva.in",
    "*.careva.in",
    "www.careva.in",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: http://localhost:3001 http://127.0.0.1:3001 ws: wss:;"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
