/**
 * Temporary build config to unblock release:
 * - Ignore ESLint and TS build errors (to be re-enabled post-release)
 * - Provide alias for next-themes shim (React 19 peer conflict workaround)
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  typescript: {
  ignoreBuildErrors: false,
  },
  eslint: {
  ignoreDuringBuilds: false,
  },
  reactStrictMode: false,
  useFileSystemPublicRoutes: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'next-themes': require('path').resolve(__dirname, 'types/shims/next-themes.ts'),
    };
    // 과도한 디렉토리 워치로 인한 메모리 사용 감소 목적 ignore
    config.watchOptions = {
      ...(config.watchOptions || {}),
      ignored: [
        '**/logs/**',
        '**/data/**',
        '**/test-results/**',
        '**/node_modules/**/.cache/**'
      ],
    };
    // 운영 데이터 고정 정책: 프로덕션 빌드 시 API Base 필수
    if (process.env.NODE_ENV === 'production') {
      const required = ['NEXT_PUBLIC_API_BASE'];
      const missing = required.filter((k) => !process.env[k] || process.env[k].trim() === '');
      if (missing.length > 0) {
        throw new Error(
          `환경 변수 누락: ${missing.join(', ')}\n` +
            '프로덕션 빌드에서 NEXT_PUBLIC_API_BASE는 반드시 설정되어야 합니다.'
        );
      }
    }

    return config;
  },
};

module.exports = nextConfig;
