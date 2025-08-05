/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15에서는 App Router가 기본 지원됨 (experimental.appDir 불필요)
  images: {
    domains: ['images.unsplash.com'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  reactStrictMode: true,
}

module.exports = nextConfig;
