import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 確保 PDF 路由能在 production / serverless 讀取 CJK 字型檔，
  // 以及 subset-font 在執行時動態讀取的 harfbuzz wasm（Next 追蹤器不會自動打包）。
  outputFileTracingIncludes: {
    "/api/jc/[id]/pdf": [
      "./assets/**",
      "./node_modules/harfbuzzjs/hb-subset.wasm",
      "./node_modules/harfbuzzjs/hb.wasm",
    ],
  },
};

export default nextConfig;
