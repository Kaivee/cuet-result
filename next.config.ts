import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16.
  // pdf-parse's optional canvas dep is a Node.js peer dep — no bundler alias needed
  // because pdf-parse runs inside a Route Handler (server-only, not bundled for browser).
  turbopack: {},
};

export default nextConfig;
