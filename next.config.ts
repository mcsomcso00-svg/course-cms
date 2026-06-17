import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 確保 PDF 路由能在 production / serverless 讀取 CJK 字型檔
  outputFileTracingIncludes: {
    "/api/jc/[id]/pdf": ["./assets/**"],
  },
};

export default nextConfig;
