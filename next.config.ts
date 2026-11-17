import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Until hotel-owned image assets are supplied, reference photos are used
  // as remote image URLs for internal visual baselining only.
};

export default nextConfig;
