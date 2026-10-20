/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Next.js Image component to serve images from Notion's S3 CDN
  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'www.notion.so',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Porto Vecchio vive sul suo sito, ma si gioca dall'indirizzo di questo:
  // /gioco/* arriva da porto-vecchio.vercel.app/v7/*, e le due chiamate del
  // gioco alla sua api vanno al suo sito. Da qui lo usano il telefono e la pagina
  // /porto-vecchio (deve restare allineato a PROGETTI.game in content.ts).
  // le illustrazioni erano una raccolta: ora ognuna e' un lavoro a se', sul banco
  async redirects() {
    return [
      { source: '/portfolio/illustrazioni', destination: '/#portfolio', permanent: false },
    ]
  },
  async rewrites() {
    const GAME = 'https://porto-vecchio.vercel.app'
    return [
      { source: '/gioco/:path*', destination: `${GAME}/v7/:path*` },
      { source: '/api/mente', destination: `${GAME}/api/mente` },
      { source: '/api/status', destination: `${GAME}/api/status` },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // R3F and Three.js need to be transpiled for Next.js compatibility
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'react-pdf', 'pdfjs-dist'],
  webpack: (config) => {
    config.resolve.alias.canvas = false
    
    // Fallback for pdfjs-dist to resolve strict ESM errors in Webpack 5
    config.resolve.alias['pdfjs-dist/build/pdf.mjs'] = 'pdfjs-dist/legacy/build/pdf.mjs'
    config.resolve.alias['pdfjs-dist/build/pdf.worker.min.mjs'] = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'

    return config
  },
}

export default nextConfig
