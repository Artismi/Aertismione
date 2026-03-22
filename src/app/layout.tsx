import type { Metadata } from 'next'
import { Bebas_Neue, Courier_Prime, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { CustomCursor } from '@/components/ui/CustomCursor'

/*
 * Bebas Neue: condensed ultra-bold sans-serif — headline occupa spazio,
 * testo come elemento visivo puro. Coerente con il pitch deck e Luminescent.
 * Le sezioni heading di Andrea (graffiti tag) verranno rimpiazzate via SVG
 * asset attraverso RawBtn/RawHeading quando Andrea consegna i lettering.
 */
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display-var',
  display: 'swap',
})

/*
 * Space Grotesk: geometrico moderno con carattere — forme leggermente "sbagliate"
 * che lo rendono simpatico e riconoscibile. Contrasto netto con la macchina da scrivere.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif-var',
  display: 'swap',
})

/*
 * Courier Prime: typewriter moderno — corpo testo con effetto
 * macchina da scrivere/codice. Supporta italic per variazione.
 */
const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body-var',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-var',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Artismi Design Studio — Identità visiva, illustrazione e grafica',
  description:
    'Costruisco identità visive per negozi, associazioni e imprese. Grafica, illustrazione, murales, social media. Progettazione partecipata.',
  openGraph: {
    title: 'Artismi Design Studio',
    description: 'Identità visiva, illustrazione e grafica',
    url: 'https://artismi.it',
    siteName: 'Artismi',
    locale: 'it_IT',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="it"
      className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${courierPrime.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preload 3D model files — browser fetches them in parallel with JS bundle */}
        <link rel="preload" href="/models/logo.glb" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/models/avatar.glb" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/models/Nave.glb" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/models/Background_v2.glb" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
