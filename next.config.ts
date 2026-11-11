import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/os/projects/*/contracts': ['./node_modules/@sparticuz/chromium/bin/**', './node_modules/@fontsource/noto-sans-kr/400.css', './node_modules/@fontsource/noto-sans-kr/files/*400-normal.woff2', './node_modules/@fontsource/noto-sans-kr/LICENSE', './public/os-app/styles.css'],
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/os/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/os-app/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
