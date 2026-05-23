import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.143.70.74", "localhost:3000"],
  // 🐝 Force Vercel to use the rock-solid standard Webpack compiler for production builds
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;