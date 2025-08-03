/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 최적화
  output: 'standalone',
  
  // 보안 및 성능
  poweredByHeader: false,
  reactStrictMode: true,
  
  // 빌드 최적화
  eslint: {
    ignoreDuringBuilds: true, // Docker 빌드 시 ESLint 오류 무시
  },
  typescript: {
    ignoreBuildErrors: true, // Docker 빌드 시 타입 체크 오류 무시
  },
  
  // 이미지 최적화
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 환경별 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // API 프록시 설정
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000/api/:path*'
          : `${apiUrl}/api/:path*`,
      },
    ];
  },
  
  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // 실험적 기능 (개발환경에서만)
  experimental: {
    // 개발 시에만 활성화
    ...(process.env.NODE_ENV === 'development' && {
      typedRoutes: true,
    }),
  },
};

export default nextConfig;
