import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    remotePatterns: [
      // AWS S3
      { protocol: 'https', hostname: '*.amazonaws.com' },
      // Nếu dùng custom endpoint (MinIO / CDN) thì thêm vào đây:
      // { protocol: 'https', hostname: 'cdn.yourdomain.com' },
      // { protocol: 'http',  hostname: 'minio.local', port: '9000' },
    ],
  },
  reactStrictMode: false,
  eslint: {
    // Không chạy ESLint khi build (Vercel/production)
    
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
