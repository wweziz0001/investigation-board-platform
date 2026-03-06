import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-fda5d0ba-13ea-4caf-a9ef-aeb56b9906bf.space.z.ai',
    '.space.z.ai',
    'localhost:3000',
    'localhost:81',
  ],
};

export default nextConfig;
