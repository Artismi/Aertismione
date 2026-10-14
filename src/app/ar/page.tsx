import type { Metadata } from 'next'
import { AR, BRAND } from '@/config/content'
import { HologramCamera } from './HologramCamera'

export const metadata: Metadata = {
  title: `${AR.title} — ${BRAND.siteTitle}`,
  alternates: { canonical: AR.url },
  robots: { index: false },
}

export default function Page() {
  return <HologramCamera />
}
