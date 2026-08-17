/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'pdf-lib', 'jszip'],
  },
};

export default nextConfig;
