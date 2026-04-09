import type { NextConfig } from "next";

// Security headers applied to every response.
// Tuned for maybetomorrow-store's current needs:
//   - Google Fonts (Fraunces, Inter) loaded via <link rel="stylesheet">
//   - Anthropic API called from the server only (not via browser)
//   - User-uploaded images served from /uploads/ (same-origin)
//   - External product photos from images.unsplash.com (configured below)
//   - inline styles + scripts needed for Next.js hydration
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js hydration + Turbopack dev runtime inject inline scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind + font providers + inline style attributes on components
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      // Uploaded images + external product photos + data URIs for previews
      "img-src 'self' data: blob: https://images.unsplash.com https://mermaid.ink",
      // iframe previews from the mockup-preview route are same-origin
      "frame-src 'self'",
      "frame-ancestors 'self'",
      // Only self + anthropic (anthropic is called from server actions so
      // browser will never hit it, but declaring is cheap)
      "connect-src 'self' https://api.anthropic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
