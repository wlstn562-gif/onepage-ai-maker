import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint is no longer a top-level key in some Next 15+ setups if using eslint.config.mjs
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
      };
    }
    return config;
  },
};

export default nextConfig;
