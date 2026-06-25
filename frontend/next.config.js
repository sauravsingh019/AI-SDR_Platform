/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  images: {
    domains: [],
  },
  // Disable strict mode in prod to avoid double-invocation issues
  reactStrictMode: false,
};

module.exports = nextConfig;
