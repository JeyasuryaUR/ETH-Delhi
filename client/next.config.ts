import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Force all pages to be dynamic to avoid prerendering issues
  trailingSlash: false,
};

export default nextConfig;
