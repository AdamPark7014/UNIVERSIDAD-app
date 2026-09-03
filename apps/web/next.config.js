/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@universidad/shared'],
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
