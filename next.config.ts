import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.143.70.74", "localhost:3000"],
  // 🐝 Force Vercel to use the standard production builder instead of Turbopack
  productionBrowserSourceMaps: false,
};

export default nextConfig;