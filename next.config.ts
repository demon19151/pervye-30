import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/bot-chat": ["./knowledge/**/*"],
  },
};

export default nextConfig;
