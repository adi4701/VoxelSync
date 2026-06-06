import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Cornerstone works better without double-mounting
  transpilePackages: ["@voxelsync/types"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Required to support WASM modules in Cornerstone
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
