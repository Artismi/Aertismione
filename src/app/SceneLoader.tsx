'use client'

/**
 * SceneLoader — thin Client Component that wraps dynamic import with ssr:false.
 *
 * In Next.js App Router, dynamic() with ssr:false is only valid inside
 * Client Components. This file is the bridge between the Server page and
 * the R3F canvas world.
 */

import dynamic from 'next/dynamic'

const ClientExperience = dynamic(() => import('./ClientExperience'), {
  ssr: false,
  loading: () => null,
})

export default function SceneLoader() {
  return <ClientExperience />
}
