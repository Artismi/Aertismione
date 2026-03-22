/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Next.js Image component to serve images from Notion's S3 CDN
  images: {
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
