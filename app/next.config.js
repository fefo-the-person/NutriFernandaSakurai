/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // simple — no image CDN needed for a single logo
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
    ]
  },
}

module.exports = nextConfig
