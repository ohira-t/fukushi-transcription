import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // さくらインターネットのサブディレクトリにデプロイする場合はbasePath設定
  // basePath: "/demo",
  // 画像最適化を無効化（静的エクスポートでは使用不可）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
