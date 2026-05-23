import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🐝 Move this directly to the root config level!
  allowedDevOrigins: ["10.143.70.74", "localhost:3000"],
};

export default nextConfig;