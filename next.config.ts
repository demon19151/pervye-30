import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Требуется для оптимизированного Docker-образа: Next.js собирает
  // минимальный автономный сервер в .next/standalone, без node_modules
  output: "standalone",
};

export default nextConfig;
