/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/trak2',
  assetPrefix: '/trak2/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig 