import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compact, self-contained production bundle — lets us ship only the
  // `.next/standalone/` directory to the server instead of the full
  // `node_modules/`. PM2 still invokes `npm run start` which wraps
  // `next start`, so the standalone bundle is the base-case fallback.
  output: "standalone",

  // Remote image whitelist — anything referenced by <Image src="https://..." />
  // must be listed here or Next.js will refuse to load it. Keep this list
  // tight; add hosts as product requirements emerge.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  experimental: {
    // Product uploads (photos, short clips) are posted to server actions,
    // so we lift the default 1 MB body limit to 10 MB. Nginx also caps
    // request bodies at 20 MB (`client_max_body_size 20M`).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
