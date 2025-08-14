/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HYPERLIQUID_API_URL: process.env.HYPERLIQUID_API_URL,
    NFL_API_KEY: process.env.NFL_API_KEY,
  },
}

module.exports = nextConfig 