import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@steel-city/api-client", "@steel-city/shared"],
};

export default nextConfig;
