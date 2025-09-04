import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    // Không chạy ESLint khi build (Vercel/production)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
