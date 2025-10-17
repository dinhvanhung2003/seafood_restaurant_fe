import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "https://seafoodrestaurantbe-production.up.railway.app/:path*",
      },
    ];
  },
};

export default nextConfig;
