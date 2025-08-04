/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // 기본 설정
  reactStrictMode: true,
  
  // 실험적 기능
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-icons'],
    optimizeCss: true,
    scrollRestoration: true,
    optimizeServerReact: true,
  },

  // Turbopack 설정 (더 이상 experimental이 아님)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },

  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },

  // 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 성능 최적화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // 압축
  compress: true,

  // 번들 분석
  bundlePagesRouterDependencies: true,

  // 트레이딩 설정
  trailingSlash: false,

  // 파워팩 설정
  poweredByHeader: false,

  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },

  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },

  // 리다이렉트
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
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
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },

  // 웹팩 설정
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // SVG 처리
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // 폰트 처리
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/fonts/',
          outputPath: 'static/fonts/',
        },
      },
    });

    // 번들 최적화
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      };
    }

    return config;
  },

  // 환경 변수
  env: {
    CUSTOM_KEY: 'my-value',
  },
};

module.exports = nextConfig;
