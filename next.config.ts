// فایل: next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.ir-thr-at1.arvanstorage.ir',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default config;