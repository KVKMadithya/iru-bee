import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.143.70.74", "localhost:3000"],
  // 🐝 Tell Next.js 16 that we acknowledge the default engine requirements
  turbopack: {},
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;