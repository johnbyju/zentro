import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            // Required for SharedArrayBuffer (WASM threading in transformers.js)
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            // 'credentialless' allows CDN resources (jsdelivr, huggingface) to load
            // while still enabling SharedArrayBuffer - unlike 'require-corp' which
            // blocks all CDN requests that don't have Cross-Origin-Resource-Policy headers
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
