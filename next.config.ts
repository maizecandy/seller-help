import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境配置
  output: 'standalone',
  
  // 域名配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  
  // 图片域名配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '**.qiniucs.com',
      }
    ]
  },
  
  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: '卖家帮',
    NEXT_PUBLIC_APP_URL: 'https://maijiahelp.com',
  }
};

export default nextConfig;
