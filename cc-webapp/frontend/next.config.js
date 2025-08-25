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
  // Produce standalone output for Docker runtime (copies minimal server + node_modules)
  output: 'standalone',
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
    return config;
  },
};

module.exports = nextConfig;
