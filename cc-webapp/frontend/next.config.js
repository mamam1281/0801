/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15에서는 App Router가 기본 지원됨
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
  // Pages Router를 완전히 비활성화
  useFileSystemPublicRoutes: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig;
