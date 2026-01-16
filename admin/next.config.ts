import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 修复 Turbopack 在 monorepo 中的根目录问题
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  },
};

export default nextConfig;
