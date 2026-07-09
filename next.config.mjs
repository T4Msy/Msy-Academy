/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The legacy vanilla prototype lives in /legacy and is not part of the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
