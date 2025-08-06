/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15에서는 App Router가 기본값이므로 experimental 설정 불필요
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
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Pages Router 완전 비활성화
  trailingSlash: false,
}

module.exports = nextConfig;
