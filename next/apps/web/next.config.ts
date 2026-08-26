import type { NextConfig } from 'next';

const pagesBasePath = process.env['ZENBLOG_BASE_PATH'] ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['127.0.0.1'],
  ...(pagesBasePath ? { basePath: pagesBasePath } : {}),
  images: {
    unoptimized: true
  }
};

export default nextConfig;
