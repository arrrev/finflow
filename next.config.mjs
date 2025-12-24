/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Ensure API routes work correctly regardless of port
  async rewrites() {
    return [];
  },
};

export default nextConfig;
