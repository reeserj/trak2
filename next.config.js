/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/trak2' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/trak2/' : '',
}

module.exports = nextConfig 