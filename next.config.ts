import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint is no longer a top-level key in some Next 15+ setups if using eslint.config.mjs
};

export default nextConfig;
