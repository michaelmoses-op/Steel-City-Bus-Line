import type { NextConfig } from "next";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@steel-city/api-client", "@steel-city/shared"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      { source: "/favicon.ico", destination: "/branding/favicon-32.png" },
    ];
  },
};

export default nextConfig;
