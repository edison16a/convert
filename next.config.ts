import type { NextConfig } from "next";

/**
 * Cross-origin isolation is what lets ffmpeg.wasm use its multi-threaded
 * core (SharedArrayBuffer). The app loads nothing from other origins, so
 * require-corp costs us nothing. Without these headers the converter falls
 * back to the single-threaded core and still works.
 */
const isolationHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  webpack: (config) => {
    // Web worker chunks carry their own webpack runtime, which trips webpack's
    // real content hash plugin on cached rebuilds ("asset cached with a
    // reference to another asset"). Plain chunk hashes are still unique per build.
    config.optimization.realContentHash = false;
    return config;
  },
  async headers() {
    return [{ source: "/:path*", headers: isolationHeaders }];
  },
};

export default nextConfig;
