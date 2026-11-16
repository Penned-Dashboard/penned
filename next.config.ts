import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Bundle terms .txt into the server build (Vercel serverless has no loose src/content files).
  outputFileTracingIncludes: {
    "/terms": ["./src/content/penned-client-terms.txt"],
    "/writer-terms": ["./src/content/penned-writer-editor-terms.txt"],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.txt$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
