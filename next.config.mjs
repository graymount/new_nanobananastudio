import bundleAnalyzer from '@next/bundle-analyzer';
import { createMDX } from 'fumadocs-mdx/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withMDX = createMDX();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/core/i18n/request.ts',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  reactStrictMode: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    qualities: [60, 70, 75],
    remotePatterns: [
      // Supabase storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Cloudflare R2 (nanobananastudio images)
      {
        protocol: 'https',
        hostname: 'images.nanobananastudio.com',
      },
      // Google user avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // GitHub avatars
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Google Gemini generated images (generativelanguage API)
      {
        protocol: 'https',
        hostname: 'generativelanguage.googleapis.com',
      },
    ],
  },
  async redirects() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/imgs/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  turbopack: {
    resolveAlias: {
      // fs: {
      //   browser: './empty.ts', // We recommend to fix code imports before using this method
      // },
    },
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    // Disable mdxRs for Vercel deployment compatibility with fumadocs-mdx
    ...(process.env.VERCEL ? {} : { mdxRs: true }),
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@tabler/icons-react',
      'react-icons',
      'framer-motion',
      'motion',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'fumadocs-ui',
    ],
  },
  reactCompiler: true,
};

export default withBundleAnalyzer(withNextIntl(withMDX(nextConfig)));
