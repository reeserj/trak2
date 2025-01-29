/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/trak2',
  assetPrefix: '/trak2/',
  trailingSlash: true,
  distDir: 'out',
}

module.exports = nextConfig 