import { PORTO_VECCHIO } from './src/config/porto-vecchio.mjs'

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
  // Porto Vecchio vive sul suo sito (PORTO_VECCHIO), ma si gioca dall'indirizzo di
  // questo: /gioco/* arriva dal suo /v7/*, e le due chiamate del gioco alla sua api
  // vanno al suo sito. Da qui lo usano il telefono e la pagina /porto-vecchio.
  // le illustrazioni erano una raccolta: ora ognuna e' un lavoro a se', sul banco
  async redirects() {
    return [
      { source: '/portfolio/illustrazioni', destination: '/#portfolio', permanent: false },
    ]
  },
  async rewrites() {
    const GAME = PORTO_VECCHIO
    return [
      { source: '/gioco/:path*', destination: `${GAME}/v7/:path*` },
      { source: '/api/mente', destination: `${GAME}/api/mente` },
      { source: '/api/status', destination: `${GAME}/api/status` },
    ]
  },
  // Le regole di sicurezza e la cache, qui e non in vercel.json: valgono su qualsiasi
  // hosting (Vercel, Netlify...) e il permesso per il riquadro del gioco segue PORTO_VECCHIO
  async headers() {
    const common = [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
    ]
    return [
      {
        source: '/((?!gioco/).*)',
        headers: [
          ...common,
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src * data: blob: https://*.githubusercontent.com https://raw.githubusercontent.com; font-src 'self' data:; connect-src 'self' blob: https://www.gstatic.com https://raw.githack.com https://raw.githubusercontent.com https://*.githubusercontent.com https://*.amazonaws.com https://www.notion.so; "
              + `frame-src 'self' ${PORTO_VECCHIO}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;`,
          },
        ],
      },
      {
        // il gioco, servito da qui: puo' stare nel riquadro del sito, non di altri
        source: '/gioco/:path*',
        headers: [
          ...common,
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src * data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' blob: data:; worker-src 'self' blob:; media-src 'self' blob: data:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;",
          },
        ],
      },
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
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
